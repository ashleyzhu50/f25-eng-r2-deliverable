/* eslint-disable */
"use client";
import { max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { csv } from "d3-fetch";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { useEffect, useRef, useState } from "react";

// Example data: Only the first three rows are provided as an example
// Add more animals or change up the style as you desire

interface AnimalDatum {
  id: string;
  name: string;
  diet: "Carnivore" | "Herbivore" | "Omnivore";
  speed: number;
}

export default function AnimalSpeedGraph() {
  // useRef creates a reference to the div where D3 will draw the chart.
  // https://react.dev/reference/react/useRef
  const graphRef = useRef<HTMLDivElement>(null);

  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  // Load CSV data

  useEffect(() => {
    async function loadData() {
      const dietOrder: Record<AnimalDatum["diet"], number> = {
        Carnivore: 0,
        Herbivore: 1,
        Omnivore: 2,
      };
      const rows: AnimalDatum[] = await csv("/sample_animals.csv", (d) => ({
        id: d["ID"]?.trim() ?? "",
        name: d["Animal"]?.trim() ?? "",
        diet: (d["Diet"]?.trim() ?? "") as "Carnivore" | "Herbivore" | "Omnivore",
        speed: Number(d["Average Speed (km/h)"]) ?? 0,
      }));

      rows.sort((a, b) => dietOrder[a.diet] - dietOrder[b.diet] || a.speed - b.speed);

      setAnimalData(rows);
    }
    loadData().catch(console.error);
  }, []);

  useEffect(() => {
    // Clear any previous SVG to avoid duplicates when React hot-reloads
    if (graphRef.current) {
      graphRef.current.innerHTML = "";
    }

    if (animalData.length === 0) return;

    // Set up chart dimensions and margins
    const containerWidth = graphRef.current?.clientWidth ?? 800;
    const containerHeight = graphRef.current?.clientHeight ?? 500;

    // Set up chart dimensions and margins
    const width = Math.max(containerWidth, 600); // Minimum width of 600px
    const height = Math.max(containerHeight, 400); // Minimum height of 400px
    const margin = { top: 70, right: 60, bottom: 80, left: 100 };

    // Create the SVG element where D3 will draw the chart
    // https://github.com/d3/d3-selection
    const svg = select(graphRef.current!).append<SVGSVGElement>("svg").attr("width", width).attr("height", height);

    // Implement the rest of the graph
    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // set up scales for x and y axes
    const xScale = scaleBand()
      .domain(animalData.map((d) => d.id))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = scaleLinear()
      .domain([0, max(animalData, (animal) => animal.speed) ?? 0])
      .nice()
      .range([innerHeight, 0]);

    // adjust X axis to hide names
    const xAxis = chart.append("g").attr("transform", `translate(0,${innerHeight})`).call(axisBottom(xScale));
    xAxis.selectAll(".tick text").remove();
    xAxis.selectAll(".tick line").remove();
    chart.append("g").call(axisLeft(yScale));

    // add axis labels
    chart
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -65)
      .attr("text-anchor", "middle")
      .text("Average Speed (km/h)");
    chart
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 65)
      .attr("text-anchor", "middle")
      .text("Animal Species");

    // plot data
    chart
      .selectAll<SVGRectElement, AnimalDatum>("rect")
      .data(animalData)
      .join("rect")
      .attr("x", (animal) => xScale(animal.id) ?? 0)
      .attr("y", (animal) => yScale(animal.speed))
      .attr("width", xScale.bandwidth())
      .attr("height", (animal) => innerHeight - yScale(animal.speed))
      .attr("fill", (animal) => {
        if (animal.diet === "Carnivore") return "crimson";
        if (animal.diet === "Herbivore") return "forestgreen";
        return "darkorange";
      })
      .append("title")
      .text((animal) => `${animal.name}: ${animal.speed} km/h`);

    const dietColors: Record<AnimalDatum["diet"], string> = {
      Carnivore: "crimson",
      Herbivore: "forestgreen",
      Omnivore: "darkorange",
    };

    // legend
    const legend = chart.append("g").attr("transform", `translate(${innerWidth - 120}, -55)`);

    (["Carnivore", "Herbivore", "Omnivore"] as const).forEach((diet, index) => {
      const item = legend.append("g").attr("transform", `translate(0, ${index * 20})`);

      item.append("rect").attr("width", 12).attr("height", 12).attr("fill", dietColors[diet]);

      item.append("text").attr("x", 16).attr("y", 10).style("font-size", "12px").text(diet);
    });
  }, [animalData]);

  // Return the graph
  return (
    // Placeholder so that this compiles. Delete this below:
    <div>
      <h1 className="text-2xl font-bold">Animal Speed Graph</h1>
      In the graph below, each bar represents a single animal species and their average speed in kilometers per hour.
      The animals are grouped by their dietary category: carnivores, herbivores, and omnivores. The colors of the dots
      correspond to these categories, allowing for easy visual comparison of speeds across different types of animals.
      <div ref={graphRef} className="h-[500px] w-full border "></div>
    </div>
  );
}
