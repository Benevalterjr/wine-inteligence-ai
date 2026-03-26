import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3ChartProps {
  type: 'chord' | 'map';
  data: any[];
  title?: string;
}

export const D3Visualizations: React.FC<D3ChartProps> = ({ type, data, title }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;
    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    if (type === 'chord') {
      renderChord(svg, data, width, height);
    } else if (type === 'map') {
      renderMap(svg, data, width, height);
    }
  }, [type, data]);

  const renderChord = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: any[], width: number, height: number) => {
    const names = Array.from(new Set(data.flatMap(d => [d.from, d.to])));
    const index = new Map(names.map((name, i) => [name, i]));
    const matrix: number[][] = Array.from({ length: names.length }, () => Array(names.length).fill(0));
    
    for (const { from, to, value } of data) {
      const i = index.get(from);
      const j = index.get(to);
      if (i !== undefined && j !== undefined) {
        matrix[i][j] += value;
      }
    }

    const innerRadius = Math.min(width, height) * 0.45;
    const outerRadius = innerRadius * 1.05;

    // Clip path for rounded corners
    svg.append('defs').append('clipPath')
      .attr('id', 'chord-clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 16);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f8f9fa')
      .attr('rx', 16);

    const g = svg.append('g')
      .attr('clip-path', 'url(#chord-clip)')
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending)(matrix);

    const arc = d3.arc<d3.ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon<d3.Chord, d3.ChordGroup>()
      .radius(innerRadius);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    g.append('g')
      .selectAll('path')
      .data(chord.groups)
      .join('path')
      .attr('fill', d => color(names[d.index]))
      .attr('d', arc as any);

    g.append('g')
      .attr('fill-opacity', 0.67)
      .selectAll('path')
      .data(chord)
      .join('path')
      .attr('d', ribbon as any)
      .attr('fill', d => color(names[d.target.index]))
      .attr('stroke', d => d3.rgb(color(names[d.target.index])).darker().toString());

    // Labels
    g.append('g')
      .selectAll('text')
      .data(chord.groups)
      .join('text')
      .each(d => { (d as any).angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('transform', d => `
        rotate(${((d as any).angle * 180 / Math.PI - 90)})
        translate(${outerRadius + 10})
        ${(d as any).angle > Math.PI ? 'rotate(180)' : ''}
      `)
      .attr('text-anchor', d => (d as any).angle > Math.PI ? 'end' : null)
      .attr('font-size', '8px')
      .attr('font-weight', '500')
      .text(d => names[d.index]);
  };

  const renderMap = async (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: any[], width: number, height: number) => {
    try {
      const world = await d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson') as any;
      
      const projection = d3.geoNaturalEarth1()
        .scale(220)
        .translate([width / 2, height / 2 + 50]);

      const path = d3.geoPath().projection(projection);

      // Clip path for rounded corners
      svg.append('defs').append('clipPath')
        .attr('id', 'map-clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 16);

      // Background for the map
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#f8f9fa')
        .attr('rx', 16);

      const g = svg.append('g').attr('clip-path', 'url(#map-clip)');

      const dataMap = new Map(data.map(d => [d.name, d.value]));
      const colorScale = d3.scaleThreshold<number, string>()
        .domain([10, 100, 1000, 10000, 100000])
        .range(d3.schemeReds[6]);

      g.selectAll('path')
        .data(world.features)
        .join('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const val = dataMap.get(d.properties.name) || 0;
          return val > 0 ? colorScale(val) : '#f0f0f0';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .append('title')
        .text((d: any) => `${d.properties.name}: ${dataMap.get(d.properties.name) || 0}`);

    } catch (error) {
      console.error('Error loading map data:', error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
