import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { cache } from "hono/cache";
import { trimTrailingSlash } from "hono/trailing-slash";
import * as cheerio from "cheerio";

const app = new Hono();

app.use("*", poweredBy(), prettyJSON(), trimTrailingSlash());

app.get(
  "*",
  cache({
    cacheName: "payment-gateway-status",
    cacheControl: "public, max-age=60",
  })
);

async function statusPageStatus(url: string) {
  try {
    const response = await fetch(url);
    const datas = await response.text();
    const $ = cheerio.load(datas);

    // Array to store the extracted data
    const gatewayStatus: {
      name: string;
      status: string;
      children: [{ name: string; status: string }];
    }[] = [];

    $(".component-container").each((i, element) => {
      const mainComponent = $(element)
        .find(".component-inner-container")
        .first();
      let mainComponentName = mainComponent
        .find(".name span:nth-child(2)")
        .text()
        .trim();
      const mainComponentStatus = mainComponent
        .find(".component-status")
        .text()
        .trim();

      // check if mainComponentName is empty get the first span
      if (mainComponentName === "") {
        mainComponentName = mainComponent.find(".name").text().trim();
      }

      const mainComponentObj: {
        name: string;
        status: string;
        children?: { name: string; status: string }[];
      } = {
        name: mainComponentName,
        status: mainComponentStatus,
        children: [] as { name: string; status: string }[],
      };

      // Scrape child components if any
      $(element)
        .find(".child-components-container .component-inner-container")
        .each((j, childElem) => {
          const childComponentName = $(childElem).find(".name").text().trim();
          const childComponentStatus = $(childElem)
            .find(".component-status")
            .text()
            .trim();

          mainComponentObj.children.push({
            name: childComponentName,
            status: childComponentStatus,
          });
        });

      gatewayStatus.push(mainComponentObj);
    });

    return gatewayStatus;
  } catch (error) {
    console.error("Error fetching or parsing data:", error);
  }
}

async function midtransStatus(id?: string) {
  const data: {
    id: string;
    title: string;
    description: string;
    status: string;
  }[] = [];

  const response = await fetch("https://midtrans.com/status");
  const datas = await response.text();
  const $ = cheerio.load(datas);
  $("div.status-list").each((i, elem) => {
    data.push({
      id: clearText($(elem).find("h3").text())
        .toLowerCase()
        .replace(/\s/g, "-")
        .replace(/---/g, "-")
        .replace(/--/g, "-"),
      title: clearText($(elem).find("h3").text()),
      description: clearText($(elem).find(".status-badge").text()),
      status: clearText($(elem).find(".status-opt").text()),
    });
  });

  if (id) {
    const result = data.filter((item) => item.id === id);
    if (result.length > 0) {
      return result[0];
    }
  }

  return data;
}

function clearText(text: string) {
  return text.replace(/\t|\n/g, "");
}

function searchChild(data: any, name: string) {
  let result = null;
  data.forEach((item: any) => {
    item.children.forEach((child: any) => {
      if (
        child.name
          .toLowerCase()
          .replace(/\s/g, "-")
          .replace(/---/g, "-")
          .replace(/--/g, "-") ===
        name
          .toLowerCase()
          .replace(/\s/g, "-")
          .replace(/---/g, "-")
          .replace(/--/g, "-")
      ) {
        result = child;
      }
    });
  });

  if (!result) {
    return {
      data: {
        message: "Data not found",
      },
      code: 404,
    };
  }

  if (result.status === "Operational") {
    return { data: result, code: 200 };
  }

  return { data: result, code: 500 };
}

// Route
app.get("/", (c) => {
  return c.json({
    xendit: "/xendit",
    duitku: "/duitku",
    midtrans: "/midtrans",
  });
});

app.get("xendit", async (c) => {
  const data = await statusPageStatus("https://status.xendit.co/");
  return c.json(data);
});

app.get("xendit/:name", async (c) => {
  const name = c.req.param("name");
  const data = await statusPageStatus("https://status.xendit.co/");
  const result = searchChild(data, name);

  return c.json(result.data, result.code);
});

app.get("duitku", async (c) => {
  const data = await statusPageStatus("https://duitku.statuspage.io/");
  return c.json(data);
});

app.get("duitku/:name", async (c) => {
  const name = c.req.param("name");
  const data = await statusPageStatus("https://duitku.statuspage.io/");
  const result = searchChild(data, name);

  return c.json(result.data, result.code);
});

app.get("midtrans", async (c) => {
  const data = await midtransStatus();
  return c.json(data);
});

app.get("midtrans/:id", async (c) => {
  const id = c.req.param("id");
  const data = await midtransStatus(id);

  if (!data) {
    return c.json({ message: "Data not found" }, 404);
  }

  if (data.status === "Operational") {
    return c.json(data, 200);
  }

  return c.json(data, 500);
});

export default app;
