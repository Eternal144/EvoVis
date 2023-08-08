class Sankey{
  constructor({ margin,width }){
    this.color_map = new Map()
    this.node_color_map = new Map()
    this.margin = margin;
    this.width = width
    this.height = 230
    this.lock = false
    this.container = d3.select('#sankey-container')
      .append('svg')
      .attr('id', 'sankey-container-svg')
      .attr('width', this.width + this.margin.left + this.margin.right )
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
    this.sankey = d3.sankey()
      .nodeWidth(12)
      .nodePadding(4)
      .size([this.width, this.height])
    
    this.data = null
    
    this.defs = this.container.append('defs')

    this.linkContainer = this.container.append('g')
    .attr('id', 'link-container')

    this.nodeContainer = this.container.append('g')
    .attr('id', 'node-container')

    this.textContainer = this.container.append('g')
    .attr('id', 'sankey-text-container')
    .attr('tranform', 'translate(780,0)')

    this.labelContainer = this.container.append('g')
    .attr('id', 'sankey-label-container')
    .attr('tranform', 'translate(0,0)')

    this.linkOpacity = [0.15, 0.3, 0.8]
    this.nodeOpacity = [0.3, 0.7, 1]

    d3.select('#sankey-container-svg').on('click',()=>{
      this.clearHighlight()
      this.lock = false;
    })
  }

  setLock(){
    this.lock = true
  }

  // 这些函数导致了这些数据标签的变化
  getFlowLfs({ ids, version, target, source }){
    let lfs = {}
    let result = []
    ids.forEach((id)=>{
      let label = funcVersion[version].label_train[id]
      if(label !== -1){
        funcVersion[version].apply_train[id].forEach((lid,i)=>{
          if( lid === label){
            const { lfs_name } = funcVersion[version]
            let name = lfs_name[i]
            if(!lfs[name]){
              lfs[name] = { ...funcVersion[version].funcs_info[name], version: `1-${version+1}`}
              funcVersion[version].link2LFs[i].push([source, target])
            }
          }
        })
      }else{
        funcVersion[version-1].apply_train[id].forEach((lid,i)=>{
          const { lfs_name } = funcVersion[version-1]
          let name = lfs_name[i]
          if( lid !== -1){
            if(funcInfo[version][name].state === DEL){
              if(!lfs[name]){
                lfs[name] = {...funcVersion[version-1].funcs_info[name], version: `1-${version}`}
                funcVersion[version-1].link2LFs[i].push([source, target])
              }
            }else{
              let id = funcVersion[version].lfs_name.findIndex(x=>x === name)
              if(!lfs[name]){
                lfs[name] = {...funcVersion[version].funcs_info[name], version: `1-${version+1}`}
                funcVersion[version].link2LFs[id].push([source, target])
              }
            }
          }
        })
      }
    })
    for(let key in lfs){
      result.push(lfs[key])
    }
    return result
  }

  getData(range){
    let nodeMap = new Map()
    // 创建数组 funcVersion.length-1
    let flowMatrix = [...Array(range[1] - range[0])].map(_=>{
      return [...Array(colorMap.size)].map(__=>{
        return [...Array(colorMap.size)].map(___=>{
            return []
        })
      })
    })
    let count = 0
    let data = {}
    data.nodes = []
    data.links = []

    let labels = funcVersion.filter((d,i)=>{
      return i >= range[0]  && i < range[1]
    }).map(x=>(x.label_train))
    
    for (let i = 0; i < labels.length; i++){
      colorMap.forEach((v, k)=>{
        let nid = count++
        nodeMap.set(`${i+1}-${k+1}`, nid)
        data.nodes.push({
          node: nid,
          name: `${i+1}-${k+1}`
        })
      })
      
      if (i === 0){ continue }
      else{
        labels[i].forEach((nextl,id)=>{
          let lastl = labels[i-1][id]
          flowMatrix[i-1][lastl+1][nextl+1].push(id)
        })
        flowMatrix[i-1].forEach((rows,x)=>{
          rows.forEach((ids,y)=>{
            if( ids.length ){
              data.links.push({
                "source": nodeMap.get(`${i}-${x}`),
                "target": nodeMap.get(`${i+1}-${y}`),
                "value": ids.length,
                "array": ids,
                "related_lfs": this.getFlowLfs({ids, version: i+selectedRange[0], source:`${i}-${x}`, target: `${i+1}-${y}` })
              })
            }
          })
        })
      }
    }
    if(range[1] - range[0] === 1){
      data.links.push({
        'source': 0,
        'target': 1,
        'value': 0,
        'array': []
      })
    }
    return data
  }

  highlightLink(links){
    this.clearHighlight()
    const { linkOpacity, nodeOpacity} = this
    d3.selectAll('.sankey-link').style('stroke-opacity', linkOpacity[0])
    d3.select(`.sankey-node`)
        .style('fill-opacity', nodeOpacity[0])
    links.forEach(link=>{
      let source = link[0]
      let target = link[1]
      d3.select(`.link-${source}-${target}`)
        .style('stroke-opacity', linkOpacity[2])
      d3.select(`.node-${source}`)
        .style('fill-opacity', nodeOpacity[2])
      d3.select(`.node-${target}`)
        .style('fill-opacity',nodeOpacity[2])
    })
  }

  highlightNode(node){
    this.clearHighlight()
    const { linkOpacity, nodeOpacity} = this
    d3.selectAll('.sankey-link').style('stroke-opacity', linkOpacity[0])
    d3.select(`.sankey-node`)
        .style('fill-opacity', nodeOpacity[0])
    d3.select(`.node-${node.name}`)
      .style('fill-opacity', nodeOpacity[2])
    node.sourceLinks.forEach(x=>{
      d3.select(`.link-${x.source.name}-${x.target.name}`)
        .style('stroke-opacity', linkOpacity[2])
    })
    node.targetLinks.forEach(x=>{
      d3.select(`.link-${x.source.name}-${x.target.name}`)
        .style('stroke-opacity', linkOpacity[2])
    })
  }

  clearHighlight(){
    const { linkOpacity, nodeOpacity} = this
    d3.selectAll(`.sankey-link`)
    .style('stroke-opacity', linkOpacity[1])
    d3.selectAll(`.sankey-node`)
      .style('fill-opacity', nodeOpacity[1])
  }

  // 每次都对graph重算
  updateSankey(){
    this.sankey.size([this.width, this.height])
    const graph = this.getData(selectedRange)
    let that = this
    this.sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(64)
    // 更新滤镜
    d3.selectAll('linearGradient').remove()

    let linkUpdate = this.linkContainer.selectAll('.link')
      .data(graph.links)
      
    linkUpdate.exit().style('opacity', 0).remove()

    linkUpdate
      .enter()
      .append('path')
      .merge(linkUpdate)
      .attr('class', (d)=>`link sankey-link link-${d.source.name}-${d.target.name}`)
      .on('mouseover', (d,i)=>{
        if(this.lock) { return; }
          this.highlightLink([[d.source.name, d.target.name]])
          let vid = +(d.target.name.split('-')[0])-1
          let sfid = +(d.source.name.split('-')[1])-1
          let tfid = +(d.target.name.split('-')[1])-1
          const data = [
            {
              key: 'version',
              value: `1-${selectedRange[0]+vid+1}`
            },
            {
              key: 'source label',
              value: colorMap.get(sfid).labelName 
            },
            {
              key: 'target label',
              value: colorMap.get(tfid).labelName
            },
            {
              key: 'count',
              value: d.array.length
            }
          ]
          renderTooltip(data)
      })
      .on('mouseout', (d,i)=>{
        clearTooltip()
        if(this.lock) { return; }
        this.clearHighlight()
      })
      .on('click', (d,i)=>{
        console.log(d)
        d3.event.stopPropagation();
        let vid = +(d.target.name.split('-')[0])-1
        zoomLine.changeSelected(selectedRange[0]+vid)
        this.highlightLink([[d.source.name, d.target.name]])
        lfsList.updateTable(d.related_lfs)
        aggregationChart.highlightRect(d.array)
        textReview.renderTexts(d.array)
        zoomLine.highlightBySankey(d.related_lfs.map(x=>func2id.get(x.name)))
        updateCodeByCodes(d.related_lfs.map(x=>x.codes).join('\n\n'))
        this.lock = true;
      })
      .attr('d', this.sankey.link())
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
        .each(function(d,i){
          let s = d.source.name.split('-')[1]
          let t = d.target.name.split('-')[1]
          let s_c = colorMap.get(+s-1).color
          let t_c = colorMap.get(+t-1).color
          let gradient = that.defs.append("linearGradient")
          .attr('id', `${i}-${s}-${t}`)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", d.source.x)
          .attr("y1", 0 )
          .attr("x2", d.target.x )
          .attr("y2", 0 );

          gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", s_c);
          
          gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", t_c);

          d3.select(this).attr('stroke', `url(#${i}-${s}-${t})`)
        })
        .attr("fill", "none")
        // .sort(function(a, b) { return a.dy - b.dy; })
        .sort(function(a, b) { return b.dy - a.dy; })
        .style('stroke-opacity', this.linkOpacity[1]);

    
    // add in the nodes
    let nodeUpdate = this.nodeContainer.selectAll(".node")
      .data(graph.nodes)
      
      nodeUpdate.exit().style('opacity', 0).remove()

      nodeUpdate
        .enter()
        .append("rect")
        .merge(nodeUpdate)
        .attr("class", d=>`node sankey-node node-${d.name}`)
        .on('mouseover', (d,i)=>{
          if(this.lock) { return; }
          this.highlightNode(d)
          let ids = []
          let links = d.sourceLinks.length ? d.sourceLinks : d.targetLinks
          links.forEach(x=>{
            ids = ids.concat(x.array)
          })
          let vid = +(d.name.split('-')[0])-1
          
          const data = [
            {
              key: 'version',
              value: `1-${selectedRange[0]+vid+1}`
            },
            {
              key: 'label',
              value: colorMap.get( +(d.name.split('-')[1])-1 ).labelName
            },
            {
              key: 'count',
              value: ids.length
            }
          ]
          renderTooltip(data)
        })
        .on('mouseout', (d,i)=>{
          clearTooltip()
          if(this.lock) { return; }
          this.clearHighlight()
        })
        .on('click', (d,i)=>{
          d3.event.stopPropagation();
          this.highlightNode(d)
          let vid = +(d.name.split('-')[0])-1
          zoomLine.changeSelected(selectedRange[0]+vid)
          let ids = []
          let links = d.sourceLinks.length ? d.sourceLinks : d.targetLinks
          links.forEach(x=>{
            ids = ids.concat(x.array)
          })
          aggregationChart.highlightRect(ids)
          textReview.renderTexts(ids)
          this.lock = true;
        })
        .attr("transform", function(d) { 
          return "translate(" + d.x + "," + d.y + ")"; 
        })
        // .append("rect")
        .attr("height", function(d) { return d.dy; })
        .attr("width", that.sankey.nodeWidth())
        .style("fill", function(d) { 
          let fid = +(d.name.split('-')[1])-1
          return colorMap.get(fid).color
        })
        .style("stroke", function(d) { 
          return 'transparent'
        })
        .style('fill-opacity', this.nodeOpacity[1])
        .append("title");
        this.updateText(graph.nodes.slice(-colorMap.size))
        this.updateLabel(graph.nodes.filter(x=>+(x.name.split('-')[1]) === 0))
  }

  updateText(nodes){
    const { textContainer } = this
    let textUpdate = textContainer.selectAll('.sankey-text').data(nodes)
      textUpdate.exit().remove()
      textUpdate.enter()
        .append('text')
        .attr('class', 'sankey-text')
        .merge(textUpdate)
        .attr('x', d=>d.x + d.dx + 6)
        .attr('y', d=>d.y + d.dy/2+10/2)
        .attr('text-anchor', 'start')
        // .attr('alignment-baseline', 'central')
        .attr('font-size', '12px')
        .attr('fill', '#555')
        .style('font-weight', 500)
        .text(d=>{
          let id = (+d.name.split('-')[1])-1
          return colorMap.get(id).labelName
        })
  }

  updateLabel(nodes){
    const { labelContainer } = this
    let textUpdate = labelContainer.selectAll('.sankey-label').data(nodes)
      textUpdate.exit().remove()
      textUpdate.enter()
        .append('text')
        .attr('class', 'sankey-label')
        .merge(textUpdate)
        .attr('x', (d,i)=>{
          return d.x-5
        })
        .attr('y', d=>d.y-6)
        .attr('text-anchor', 'center')
        // .attr('alignment-baseline', 'central')
        .attr('font-size', '12px')
        .attr('fill', '#555')
        .style('font-weight', 500)
        .text((d,i)=>{
          return `1-${selectedRange[0]+i+1}`
        })
  }
}