class LFsBurst{
    constructor(){
        this.width = 300
        this.height = 300
        this.radius = 140
        this.format = d3.format(",d")
        this.container = d3.select("#relation-container").append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr('id', 'lfs-relation-svg')
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
        this.selectedCgr = null
    } 
    
    renderBurst(vid, fid){
        const { arc, partition, format, radius, container } = this
        let data = this.processData(vid, fid)
        container.selectAll('g').remove()
        let root = partition(data)
        let aHistory = []
        let oLastZoomed = root
        root.each(d => d.current = d)
        let g = this.container.append("g");
        let paths = g.append('g')
            .selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            .attr('class', 'arc-path')
            .on('mouseover', function(d,i){
                d3.select(this).attr("fill-opacity", 1)
                let data = []
                if(d.depth === 0){
                    return
                }else if( d.depth === 1 ){
                    data = [
                        {
                            key: 'label',
                            value: colorMap.get(+d.data.name).labelName
                        },
                        {
                            key: 'labeled count',
                            value: d.data.data.length
                        }
                    ]
                }else{
                    return
                }
                renderTooltip(data)  
            })
            .on('mouseout', function(){
                clearTooltip()
                d3.selectAll('.arc-path').attr("fill-opacity", d => d.children ? 1 : 0.6)
            }) 
            .attr("fill", d => { 
                if (d.depth===0 ) return lfsColor
                else{
                    return colorMap.get(+d.data.name).color
                }
            })
            .attr("fill-opacity", d => d.children ? 1 : 0.6)
            .attr("d", arc)
            .attr("id", function(d,i){
                return 'cp-' + i;
            });
    
        paths.style('cursor', 'pointer')
            .on("click", (p)=> {
                if(p.depth === 0 ){
                    togglePie()
                }else{
                    this.selectedCgr = p.data
                    // this.targetTids = p.data.data
                    if(filterFlag){
                        textReview.renderTexts(this.renderFilterText())
                    }else{
                        textReview.renderTexts(p.data.data)
                    }
                    
                }
            });
    
        const labels = g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants())
            .enter().append("text")
            .attr("transform", d => d.depth ? labelTransform(d) : '')
            .attr("fill-opacity", d => +labelVisible(d) )
            .style("font-size", d => d.depth ? '12px' : '14px')
            .style('fill','#fff')
            .style('font-weight', '600')
            .attr("dy", "0.35em")
            .attr("clip-path", function(d, i){
                return 'url(#cp-'+ i + ')';
            })
            .text(d => {
                let label = d.depth ? colorMap.get(+d.data.name).labelName : `${d.data.name}`
                let lSplit = d.depth ? label.slice(0, 8) : label.slice(0, 10)
                return arcText(d, lSplit)
            });
    }

    processData(vid, fid){
        let data = funcVersion[vid]
        const { funcs_info,label_train } = data
        let lfsName = gId2func[fid]
        // let lfsName = id2func[fid]
        let obj = { name: `${fid+1}-${lfsName}`, children: []}
        funcs_info[lfsName].labelsMap.forEach((v,k)=>{
            let node = {
                name: k,
                size: v.length,
                data: v,
                inconsistence: []
            }
            v.forEach((tid, i)=>{
                if(label_train[tid] !== k){
                    node.inconsistence.push(tid)
                }
            })

            obj.children.push(node)
        })
        return obj
    }
    hide(){
        d3.select('#lfs-relation-svg')
            .style('display', 'none')
    }
    show(){
        d3.select('#lfs-relation-svg')
            .style('display', '')
    }

    renderEntireText(){
        textReview.renderTexts(this.selectedCgr.data)
    }

    renderFilterText(){
        textReview.renderTexts(this.selectedCgr.inconsistence)
    }
}