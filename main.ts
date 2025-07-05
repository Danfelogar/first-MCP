import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

//1. create server: this is the main interface to the MCP. Management of communication between the client and the server.

const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

//2. define tools: Tools allow the LLM to perform actions through the server.
server.tool(
  "fetch-weather", //Title of the tool
  "Tool to fetch weather of a city", //Description of the tool
  {
    // params that could be received by the tool
    city: z.string().describe("The name of the city to fetch the weather for"),
  },
  async ({ city }) => {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`
    );

    const data: { results: Array<{ latitude: number; longitude: number }> } =
      await response.json();

    if (!data || data?.results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No weather data found for the city: " + city,
          },
        ],
      };
    }
    const { latitude, longitude } = data.results[0];

    const responseByCoordinates = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,precipitation,is_day,rain&forecast_days=1`
    );

    const weatherData = await responseByCoordinates.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(weatherData, null, 2),
        },
      ],
    };
  }
);

//3. listen connection of client
const transport = new StdioServerTransport();
await server.connect(transport);
