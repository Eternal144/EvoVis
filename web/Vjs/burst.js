class SunBurst{
    constructor(){
        this.width = 300
        this.height = 300
        this.radius = 140
        this.format = d3.format(",d")
        this.container = d3.select("#relation-container").append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr('id', "full-relation-svg")
        .attr("transform", "translate(" + 55 + ",10)")
        .append("g")
        .attr("transform", "translate(" + this.width / 2 + "," + (this.height / 2) + ")");

        this.arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.01))
            .padRadius(this.radius / 2)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1 - 1)

        this.partition = data => d3.partition()
        .size([2 * Math.PI, this.radius])
        (d3.hierarchy(data)
            .sum(d => d.size)
            .sort((a, b) => b.value - a.value))
    } 
    
    async renderBurst(vid){
        const { arc, partition, format, radius, container } = this
        let data = await eel.num2portion(this.processData(vid))()
        // console.log(data)
        container.selectAll('g').remove()
        let root = partition(data)
        let aHistory = []
        let oLastZoomed = root
        root.each(d => d.current = d)
        let g = this.container.append("g");
        let paths = g.append('g')
            .attr("fill-opacity", 0.6)
            .selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            .attr('class', 'arc-path')
            .on('mouseover', function(d,i){
                d3.select(this).attr("fill-opacity", 1)

                let data = []
                if(d.height === 0){
                    data = [
                        {
                            key: 'label',
                            value: colorMap.get(+d.data.name).labelName
                        },
                        {
                            key: `labeled by ${d.parent.data.name}`,
                            value: d.data.originSize
                        }
                    ]
                }else if( d.height === 1 ){
                    data = [
                        {
                            key: 'LFs name',
                            value: `${ func2id.get(d.data.name)+1}-${d.data.name}`
                        },
                        {
                            key: 'labeled count',
                            value: d.data.originSize
                        }
                    ]
                }else if( d.height === 2 ){
                    data = [
                        {
                            key: 'label',
                            value: colorMap.get(+d.data.name).labelName
                        },
                        {
                            key: 'labeled count',
                            value: d.data.originSize
                        },
                        {
                            key: 'LFs count',
                            value: d.children.length
                        }
                    ]
                }else{
                    return;
                }
                renderTooltip(data)  
            })
            .on('mouseout', function(){
                clearTooltip()
                d3.selectAll('.arc-path').attr("fill-opacity", d => d.children ? 0.8 : 0.6)
                }) 
            .attr("fill", d => { 
                if (d.depth === 0) return 'transparent'
                if(d.data.type){
                    return lfsColor
                }else{
                    return colorMap.get(+d.data.name).color
                }
            })
            .attr("fill-opacity", d => d.children ? 0.8 : 0.6)
            .attr("d", arc)
            .attr("id", function(d,i){
                return 'cp-' + i;
            });
    
        paths.filter(d => d.children)
            .style('cursor', 'pointer')
            .on("click", function(p) {
                  let target;
                  if (p.depth > 1) {
                    target = p.bZoomed ? p : (p.children ? p : p.parent);
                  }else{
                    target = p;
                  }
                  
                  if(target.bZoomed){
                    delete target.bZoomed;
                    target = oLastZoomed = aHistory.pop();
                
                    if (!aHistory.length) {
                      root.bHighlighted = true;
                      target = oLastZoomed = root;
                    }
                  }else{
                    target.bZoomed = true;
                    if (oLastZoomed) {
                      aHistory.push(oLastZoomed);
                    }
                    oLastZoomed = target;
                  }
                  root.each(function(d){ 
                    d.target = {
                      x0: Math.max(0, Math.min(1, (d.x0 - target.x0) / (target.x1 - target.x0))) * 2 * Math.PI,
                      x1: Math.max(0, Math.min(1, (d.x1 - target.x0) / (target.x1 - target.x0))) * 2 * Math.PI,
                      y0: Math.max(0, d.y0 - target.y0),
                      y1: Math.max(0, d.y1 - target.y0)
                    }; 
                  });
                
                  const t = g.transition().duration(750);
                  paths.transition(t)
                      .tween("data", d => {
                        const i = d3.interpolate(d.current, d.target);
                        return t => d.current = i(t);
                      })
                      .attrTween("d", d => () => arc(d.current));
                  
                  labels.transition(t)
                      .attr("fill-opacity", d => +labelVisible(d.target) )
                      .attrTween("transform", d => () => labelTransform(d.current, true));
                });
    
        const labels = g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants().filter(d => d.depth))
            .enter().append("text")
            .attr("transform", d => labelTransform(d))
            .attr("fill-opacity", d => +labelVisible(d) )
            .style("font-size", '10px')
            .style('fill','#fff')
            // .style('fill','#4D455D')
            .style('font-weight', '600')
            .attr("dy", "0.35em")
            .attr("clip-path", function(d, i){
            return 'url(#cp-'+ i + ')';
            })
            .text(d => {
                if(radius < 80) return ''
                let label = d.data.type ? `${func2id.get(d.data.name)+1}-${d.data.name}` : colorMap.get(+d.data.name).labelName
                return arcText(d, label.slice(0, 5))
            });
    }

    processData(vid){
        // 在这里处理一个层级信息然后传给python，版本1
        let obj = { name: '-1', children: [] }
        let data = funcVersion[vid]
        let lfsInfo = funcInfo[vid]
        let count = [...Array(labelNameList.length)].map(_=>0)
        let labelMap = new Map()
        data.label_train.forEach(x=>{
            if(x !== -1){
                count[x]++
            }
        })
        count.forEach((x,i)=>{
            obj.children.push({
                name: `${i}`,
                children: [],
                size: x,
            })
        })
        // 计算每个类别被哪些标注函数标注了，分别多少个
        data.apply_train.forEach((x,i)=>{
            x.forEach((label,j)=>{
                if( label !== -1 ){
                    if( labelMap.has(label) ){
                        let countList = labelMap.get(label)
                        countList[j]++
                        labelMap.set(label, countList )
                    }else{
                        let countList = [ ...Array(data.lfs_name.length) ].map(_=>0)
                        countList[j]++
                        labelMap.set(label, countList )
                    }
                }
            })
        })
        
        // 每个函数
        labelMap.forEach((v,k)=>{
            v.forEach((x,i)=>{
                if( x > 0 ){
                    let name = data.lfs_name[i]
                    let children = []
                    lfsInfo[name].labelsMap.forEach((v,k)=>{
                        children.push({
                            name: `${k}`,
                            size: v.length
                        })
                    })
                    obj.children[k].children.push({
                        name,
                        children,
                        size: x,
                        type: 'lfs'
                    })
                }
            })
        })
        return obj
    }
    
    hide(){
        d3.select('#full-relation-svg')
        .transition()
        .duration(300)
        .style("display", "none")
    }
    show(){
        d3.select('#full-relation-svg')
        .transition()
        .duration(300)
        .style("display", "")
    }

}

const labelVisible = (d)=>{
    return (d.x1 - d.x0 > 0) && ((d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10);
}

const labelTransform= (d, rotate)=>{
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 ;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 200 ? 0 : 180})`;
}

const arcText = (d, sKey)=>{
    var CHAR_SPACE = 7,
    deltaAngle = d.x1 - d.x0,
    r = Math.max(0, (d.y0 + d.y1) / 2),
    perimeter = r * deltaAngle,
    iMinLength = 3, 
    iMaxLength = Math.floor(perimeter/CHAR_SPACE);

    iMaxLength = iMaxLength < iMinLength ? 0 : iMaxLength;
    return sKey; //(sKey || '').toString().slice(0, iMaxLength);
}

// const togglePie = ()=>{
    
// }