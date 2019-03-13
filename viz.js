//Define Margin
var margin = { left: 0, right: 0, top: 40, bottom: 10 },
  width = 500 + margin.left + margin.right,
  height = 500 + margin.top + margin.bottom;

//Define SVG
// -- fire
var svg_fire = d3.select("#visualization")
  .append("svg")
  .attr("id", "map-svg-fire")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var geo_map_fire = svg_fire.append("g")
  .attr("class", 'geo-map');
var counties_fire = geo_map_fire.append("g")
  .attr("class", "counties");
var path_fire = d3.geoPath();
// -- aqi
var svg_aqi = d3.select("#visualization")
  .append("svg")
  .attr("id", "map-svg-aqi")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var geo_map_aqi = svg_aqi.append("g")
  .attr("class", 'geo-map');
var counties_aqi = geo_map_aqi.append("g")
  .attr("class", "counties");
var path_aqi = d3.geoPath();

// Global Variables
var fire_data, aqi_data, map_title_fire, map_title_aqi, aqi_desc_map, linechart_title;
const NUM_MONTH = 12 * 10;

// Zoom
function zoomed() {
  geo_map_fire.attr("transform", d3.event.transform);
  geo_map_aqi.attr("transform", d3.event.transform);
}

function zoomed_smooth() {
  geo_map_fire.transition()
    .duration(500)
    .attr("transform", d3.event.transform);
  geo_map_aqi.transition()
    .duration(500)
    .attr("transform", d3.event.transform);
}

var zoom = d3.zoom()
  .scaleExtent([1.0, 8])
  .on("zoom", zoomed);

var zoom_smooth = d3.zoom()
  .scaleExtent([1.0, 8])
  .on("zoom", zoomed_smooth);

function reset_zoom() {
  svg_fire.call(zoom_smooth.transform, d3.zoomIdentity);
  svg_aqi.call(zoom_smooth.transform, d3.zoomIdentity);
}

// Timeline
var formatTime = d3.timeFormat("%b %Y");
var parseTime = d3.timeParse("%Y%m");
var ym_list = [];

function idx_to_ym(i) {
  var m = i % 12 + 1;
  var y = 2009 + parseInt(i / 12);
  return String(y * 100 + m)
}

function ym_to_idx(ym) {
  var y = Number(ym.slice(0, 4));
  var m = Number(ym.slice(4));
  return (y - 2009) * 12 + m - 1;
}

for (var i = 0; i < NUM_MONTH; i++) {
  ym_list.push(idx_to_ym(i));
}
var cur_ym = ym_list[0];

function set_ym(ym, auto) {
  cur_ym = ym;
  fill_color(auto);
  map_title_fire.text(`Fire Damage Map, ${formatTime(parseTime(cur_ym))}`);
  map_title_aqi.text(`Air Quality Index Map, ${formatTime(parseTime(cur_ym))}`);
}

function reset_cur_ym(idx, auto) {
  var new_ym = idx_to_ym(idx);
  if (new_ym !== cur_ym) {
    set_ym(new_ym, auto);
  }
}

// Fill Color
var fire_color = d3.scaleThreshold().domain([20, 50, 100, 200, 400, 1000, 3000, 10000, 50000]).range(d3.schemeReds[9]);
var AQI_colorScheme = ['#eff0f1', '#00E400', '#FFFF00', '#FF7E00', '#FF0000', '#8f3f97', '#7E0023'];
var aqi_color = d3.scaleThreshold().domain([0, 50, 100, 150, 200, 300, 500]).range(AQI_colorScheme);

function AQI_colorScale(aqi) {
  var noValueColor = '#eff0f1';
  if (aqi < 0) {
    return noValueColor;
  } else if (aqi <= 50) {
    return AQI_colorScheme[1];
  } else if (aqi <= 100) {
    return AQI_colorScheme[2];
  } else if (aqi <= 150) {
    return AQI_colorScheme[3];
  } else if (aqi <= 200) {
    return AQI_colorScheme[4];
  } else if (aqi <= 300) {
    return AQI_colorScheme[5];
  } else {
    return AQI_colorScheme[6];
  }
}

function fill_color(auto) {
  counties_fire.selectAll("path")
    .transition()
    .duration(auto ? 500 : 0)
    .style("fill", function (d) {
      return fire_color(fire_data[cur_ym][d.id]);
    });
  counties_aqi.selectAll("path")
    .transition()
    .duration(auto ? 500 : 0)
    .style("fill", function (d) {
      return AQI_colorScale(aqi_data[cur_ym][d.id][0])
    });
}

// Legend
function draw_color_legend(base_svg, x, color, domain, name, caption) {
  x = x.domain(domain).rangeRound([220, 480]);

  if (name === 'fire') {
    window.xxx = x;
  }

  var g = base_svg.append("g")
    .attr("class", "legend legend-" + name)
    .attr("transform", "translate(0, 20)");

  var rect = g.selectAll("rect")
    .data(color.range().map(function (d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function (d) {
      return x(d[0]);
    })
    .attr("width", function (d) {
      return x(d[1]) - x(d[0]);
    })
    .attr("fill", function (d) {
      return color(d[0]);
    });

  if (name === 'aqi') {
    rect.on("mouseover", function (d) {
      var descObj = aqi_desc_map[d[1].toString()];
      if (descObj === undefined) {
        return;
      }
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(getAQIDescTooltipHtml(descObj))
        .style("left", (d3.event.pageX + 4) + "px")
        .style("top", (d3.event.pageY + 4) + "px");
    })
      .on("mouseout", function (d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
  }

  g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text(caption);

  g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain()))
    .select(".domain")
    .remove();

  return g;
}

var fire_legend = draw_color_legend(svg_fire, d3.scaleLog().base(2), fire_color, [10, 60000], 'fire',
  'Total acres burned');
var aqi_legend = draw_color_legend(svg_aqi, d3.scaleLinear(), aqi_color, [-10, 500], 'aqi',
  'Averaged Top 5 Day Air Quality Index');
// Tooltip
var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

function getTooltipHtml(data) {
  var out = "";
  out += `<span class="cty-name">${data.properties.name}</span>` + '<br>';
  out += "<span class='sp-left'>Acres Burned: </span><span class='sp-right'>" + fire_data[cur_ym][data.id] + '</span><br>';
  for (var idx = 0; idx < line_categories.length; idx++) {
    var value = aqi_data[cur_ym][data.id][idx];
    if (value === -1) {
      value = 'N/A';
    }
    out += "<span class='sp-left'>" + line_categories[idx]['label'] + "</span><span class='sp-right'>" + value + '</span><br>';
  }
  return out
}

function loaded(err, cal, _fire_data, _aqi_data, _aqi_desc_map) {
  fire_data = _fire_data;
  aqi_data = _aqi_data;
  aqi_desc_map = _aqi_desc_map;

  if (err) return console.error(err);

  // Render CA Counties
  counties_fire.selectAll("path")
    .data(topojson.feature(cal, cal.objects.counties).features)
    .enter().append("path")
    .attr("d", path_fire)
    .attr("class", function (d) {
      return `county-path-${d.id}`
    })
    .on("mouseover", function (d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(getTooltipHtml(d))
        .style("left", (d3.event.pageX + 4) + "px")
        .style("top", (d3.event.pageY + 4) + "px");
      d3.selectAll(`.county-path-${d.id}`).attr("class", `county-path-${d.id} highlight`);
      // set_legend_desc(AQI_to_legend_idx(aqi_data[cur_ym][d.properties.id][6]));
    })
    .on("mouseout", function (d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
      d3.selectAll(`.county-path-${d.id}`).attr("class", `county-path-${d.id}`);
    })
    .style("fill", function (d) {
      return "#FFF";
    })
    .on("click", function (d) {
      linechart_title.text(d.properties.name);
      draw_line(d.id);
    });
  counties_aqi.selectAll("path")
    .data(topojson.feature(cal, cal.objects.counties).features)
    .enter().append("path")
    .attr("d", path_aqi)
    .attr("class", function (d) {
      return `county-path-${d.id}`
    })
    .on("mouseover", function (d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(getTooltipHtml(d))
        .style("left", (d3.event.pageX + 4) + "px")
        .style("top", (d3.event.pageY + 4) + "px");
      d3.selectAll(`.county-path-${d.id}`).attr("class", `county-path-${d.id} highlight`);
      // set_legend_desc(AQI_to_legend_idx(aqi_data[cur_ym][d.properties.id][6]));
    })
    .on("mouseout", function (d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
      d3.selectAll(`.county-path-${d.id}`).attr("class", `county-path-${d.id}`);
    })
    .style("fill", function (d) {
      return "#FFF";
    })
    .on("click", function (d) {
      linechart_title.text(d.properties.name);
      draw_line(d.id);
    });

  svg_fire.call(zoom);
  svg_aqi.call(zoom);

  map_title_fire = svg_fire.append("text")
    .attr("class", "viz-title map-title noselect")
    .attr("x", width / 2 - 10)
    .attr("y", -10)
    .text("");
  map_title_aqi = svg_aqi.append("text")
    .attr("class", "viz-title map-title noselect")
    .attr("x", width / 2 - 10)
    .attr("y", -10)
    .text("");

  reset_cur_ym(114);

  linechart_svg.append("g")
    .attr("class", "line-chart-lines");

  var lines = linechart_svg.selectAll(".line-chart-lines");
  // for line chart
  linechart_svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + lc_height + ")")
    .call(d3.axisBottom(lc_xScale));

  linechart_svg.append("g")
    .attr("class", "axis axis--y-aqi")
    .call(d3.axisLeft(lc_aqi_yScale))
    .append("text")
    .text("Air Quality Index")
    .attr("transform", "rotate(-90)")
    .attr("x", -(lc_height / 2))
    .attr("dy", "-32px")
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .attr("font-size", "12px");

  linechart_svg.append("text")
    .attr("class", "viz-title linechart-title noselect")
    .attr("x", lc_width / 2)
    .attr("y", 0)
    .text("Air Pollutant Trends");

  linechart_title = linechart_svg.append("text")
    .attr("class", "viz-title linechart-city-name noselect")
    .attr("id", "linechart-city-name")
    .attr("x", lc_width / 2)
    .attr("y", 14)
    .text("");

  var checkboxes = d3.select("#checkbox-list").selectAll(".aqi-checkbox")
    .data(line_categories)
    .enter()
    .append("li")
    .attr("class", "aqi-checkbox");

  function initCheckBox(d) {
    d3.select(this)
      .attr("checked", d.enable ? '' : null);
  }

  checkboxes.append("input")
    .attr("type", "checkbox")
    .attr("id", function (d) {
      return d.id + '_checkbox';
    })
    .attr("aqi-label-data", function (d) {
      return d.id
    })
    .on("change", checkChanged)
    .each(initCheckBox);

  checkboxes.append("label")
    .attr("for", function (d) {
      return d.id + '_checkbox';
    })
    .style('color', function (d) {
      return zScale(d.id);
    })
    .on("mouseover", function (d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      if (d.desc === undefined) {
        return
      }
      tooltip.html(d.desc)
        .style("left", (d3.event.pageX + 4) + "px")
        .style("top", (d3.event.pageY + 4) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .text(function (d) {
      return d.label;
    });
}

d3.queue().defer(d3.json, "ca-counties-500.json")
  .defer(d3.json, "fire_data/fire_data.json")
  .defer(d3.json, "AQI_data/AQI_for_county.json")
  .defer(d3.json, "AQI_data/aqi_desc_map.json")
  .await(loaded);


// Slider
var slider = sliderFactory();
d3.select('#slider_holder').call(slider
  .height(70)
  .width(900)
  .margin({
    top: 35,
    right: 40,
    bottom: 15,
    left: 40
  })
  .value(114).ticks(12).scale(true).range([0, 12 * 10 - 1]).step(1).label(true)
  .dragHandler(function (d) {
    reset_cur_ym(d.value());
  }));

var cur_ap_id = null;

function auto_play_on() {
  function apply_next_ym() {
    slider.value((ym_to_idx(cur_ym) + 1) % NUM_MONTH);
    slider();
    reset_cur_ym(slider.value(), true);
  }

  apply_next_ym();
  cur_ap_id = setInterval(apply_next_ym, 1000);
}

function auto_play_off() {
  if (cur_ap_id) {
    clearInterval(cur_ap_id);
    cur_ap_id = null;
  }
}

$(function () {
  $('#toggle-autoplay').bootstrapToggle({
    width: 128
  })
    .change(function () {
      if ($(this).prop('checked')) {
        auto_play_on();
      } else {
        auto_play_off();
      }
    });
});


// LineChart
var lc_margin = { left: 41, right: 20, top: 10, bottom: 20 },
  lc_width = 880 - lc_margin.left - lc_margin.right,
  lc_height = 180 - lc_margin.top - lc_margin.bottom;
// lg_margin = {left: 10, right: 20, top: 20, bottom: 20},
// legend_height = 260 - lg_margin.top - lg_margin.bottom;

var linechart_svg = d3.select("#viz-bottom")
  .append("svg")
  .attr("width", lc_width + lc_margin.left + lc_margin.right)
  .attr("height", lc_height + lc_margin.top + lc_margin.bottom)
  .append("g")
  .attr("transform", "translate(" + lc_margin.left + "," + lc_margin.top + ")");

function tweenDashoffsetOn() {
  const l = this.getTotalLength(),
    i = d3.interpolateString("" + l, "0");
  return function (t) {
    return i(t);
  };
}

function tweenDashoffsetOff() {
  const l = this.getTotalLength(),
    i = d3.interpolateString("0", "" + l);
  return function (t) {
    return i(t);
  };
}

var FIRE_DMG_CAP = 120000;
var lc_xScale = d3.scaleTime().range([0, lc_width]).domain([parseTime("200901"), parseTime("201812")]),
  lc_aqi_yScale = d3.scaleLinear().rangeRound([lc_height, 0]).domain([0, 350]),
  lc_fire_yScale = d3.scaleLog().base(2).rangeRound([lc_height, 0]).domain([10, FIRE_DMG_CAP]),
  zScale = d3.scaleOrdinal(d3.schemeCategory10);

var line_aqi = d3.line()
  .curve(d3.curveCatmullRom) // interpolate the curve
  .x(function (d) {
    return lc_xScale(d.year);
  })
  .y(function (d) {
    return lc_aqi_yScale(Math.min(d.aqi, 500));
  });

var line_fire = d3.line()
  .curve(d3.curveCatmullRom) // interpolate the curve
  .x(function (d) {
    return lc_xScale(d.year);
  })
  .y(function (d) {
    return lc_fire_yScale(Math.max(Math.min(d.fire, FIRE_DMG_CAP), 1));
  });

function draw_line(ctyId) {

  function initDash() {
    d3.select(this)
      .attr("stroke-dasharray", this.getTotalLength() + "," + this.getTotalLength())
      .attr("stroke-dashoffset", "" + this.getTotalLength());
  }

  var lines = linechart_svg.selectAll(".line-chart-lines");

  lines.selectAll("path")
    .transition()
    .duration(1000)
    .filter(function (d) {
      return d.cate.enable
    })
    .attrTween("stroke-dashoffset", tweenDashoffsetOff)
    .remove();

  for (var idx = 0; idx < line_categories.length; idx++) {
    var line_data = { value: [], cate: line_categories[idx] };
    if (line_categories[idx].aqi) {
      for (var i = 0; i < NUM_MONTH; i++) {
        var ym = idx_to_ym(i);
        line_data.value.push({
          year: parseTime(ym),
          aqi: aqi_data[ym][ctyId][idx],
        });
      }
    } else {
      for (var i = 0; i < NUM_MONTH; i++) {
        var ym = idx_to_ym(i);
        line_data.value.push({
          year: parseTime(ym),
          fire: fire_data[ym][ctyId],
        });
      }
    }
    var line_func = line_categories[idx].aqi ? line_aqi : line_fire;
    lines.append("path")
      .datum(line_data)
      .attr("class", "line")
      .attr("id", function (d) {
        return line_categories[idx].id
      })
      .attr("d", function (d) {
        return line_func(d.value);
      })
      .style("stroke", function (d) {
        return zScale(line_categories[idx].id);
      })
      .each(initDash)
      .transition()
      .duration(2000)
      .filter(function (d) {
        return line_categories[idx].enable;
      })
      .attrTween("stroke-dashoffset", tweenDashoffsetOn);
  }
}

// # top5 avg AQI, AQI, CO, Ozone, SO2, PM10, PM2.5, NO2
var line_categories = [
  { label: 'Avg Top5 AQI', enable: true, aqi: true, id: 'top_5_aqi'},
  { label: 'Avg AQI', enable: true, aqi: true, id: 'avg_aqi' },
  { label: 'Avg CO', enable: true, aqi: true, id: 'co_aqi',
    desc: '<span class="cty-name">Carbon Monoxide</span>' +
      '<p class="pollutant-desc">' +
      'People with cardiovascular disease may experience chest pain and other cardiovascular symptoms. ' +
      'Exposure to higher levels of carbon monoxide can affect mental alertness and vision.</p>' },
  { label: 'Avg Ozone', enable: false, aqi: true, id: 'ozone_aqi',
    desc: '<span class="cty-name">Ozone</span>' +
      '<p class="pollutant-desc">' +
      'People with lung diseases will experience more serious health effects. Children are more likely to have asthma. ' +
      '</p>' },
  { label: 'Avg SO2', enable: false, aqi: true, id: 'so2_aqi' ,
    desc: '<span class="cty-name">Ozone</span>' +
      '<p class="pollutant-desc">' +
      'It may bring wheezing, chest tightness, and shortness of breath especially to people with asthma. </p>'
  },
  { label: 'Avg PM10', enable: true, aqi: true, id: 'pm10_aqi',
    desc: '<span class="cty-name">Particle Matter <= 10 μm</span>' +
      '<p class="pollutant-desc">Small particles less than 10 micrometers in diameter pose the greatest problems:</p>' +
      '<ul style="max-width: 200px; text-align: left; margin: 5px 0 3px 0; padding-left: 8% ">' +
        '<li>premature death in people with heart or lung disease</li>' +
        '<li>nonfatal heart attacks</li>' +
        '<li>irregular heartbeat</li>' +
        '<li>aggravated asthma</li>' +
        '<li>decreased lung function</li>' +
        '<li>increased respiratory symptoms</li>' +
      '</ul>'
  },
  { label: 'Avg PM2.5', enable: false, aqi: true, id: 'pm2_5_aqi',
    desc: '<span class="cty-name">Particle Matter <= 2.5 μm</span>' +
      '<p class="pollutant-desc">Small particles less than 10 micrometers in diameter pose the greatest problems:</p>' +
      '<ul style="max-width: 200px; text-align: left; margin: 5px 0 3px 0; padding-left: 8% ">' +
        '<li>premature death in people with heart or lung disease</li>' +
        '<li>nonfatal heart attacks</li>' +
        '<li>irregular heartbeat</li>' +
        '<li>aggravated asthma</li>' +
        '<li>decreased lung function</li>' +
        '<li>increased respiratory symptoms</li>' +
      '</ul>'
  },
  { label: 'Avg NO2', enable: false, aqi: true, id: 'no2_aqi',
    desc: '<span class="cty-name">Nitrogen Dioxide</span>' +
      '<p class="pollutant-desc">' +
      'It may bring adverse respiratory effects including airway inflammation in healthy people and ' +
      'increased respiratory symptoms in people with asthma.' +
      '</p>'
  },
  // {label: 'Fire Damage', enable: true, aqi: false},
];

zScale.domain(line_categories.map(function (l) {
  return l.id;
}));


function checkChanged() {
  var checked = this.checked;
  var aqi_label_id = this.getAttribute("aqi-label-data");
  g = d3.select("#" + aqi_label_id);
  if (!checked) {
    g.transition()
      .duration(2000)
      .attrTween("stroke-dashoffset", tweenDashoffsetOff);

  } else {
    g.transition()
      .duration(2000)
      .attrTween("stroke-dashoffset", tweenDashoffsetOn);

  }
  for (var i = 0; i < line_categories.length; i++) {
    if (line_categories[i].id === aqi_label_id) {
      line_categories[i].enable = checked;
    }
  }
}

function getAQIDescTooltipHtml(DescObj) {
  var out = `<span class="cty-name">${DescObj.level}</span>` + '<br>';
  out += `<p style="max-width: 200px; margin: 5px 0 0 0;">${DescObj.meaning}</p>`;
  return out
}
