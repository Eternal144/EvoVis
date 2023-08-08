class VersionLine{
    constructor({ width, margin, container_name }){
        this.width = width
        this.margin = margin
        this.height = 140
        this.selectedV = -1
        this.container = d3.select(`#${container_name}`)
            .append('svg')
            .attr('id', `${container_name}-svg`)
            .attr('width', this.width  + this.margin.left + this.margin.right)
            .attr('height', this.height  + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

        this.xScale = d3.scaleOrdinal()
        // this.xScale = d3.scaleLinear()
        this.yScale = d3.scaleBand()
            .range([this.height, 0])
        this.rScale = d3.scaleQuantize()
            .domain([0,1]) //这里的domain要根据实际情况进行修改
            .range(d3.range(4,8))
        this.ccolor = d3.scaleSequential(d3.interpolateGreys)
        this.xAxis = this.container.append('g')
            .attr('class', 'version-axis')
            .attr('id', 'version-x')
        this.yAxis = this.container.append('g')
            .attr('class', 'version-axis')
            .attr('id', 'version-y')
        this.funcEvoluaiton = []
        this.textg = this.container.append('g')
        this.func2id = new Map
        this.id2func = []
        this.start = -1
    }
    

    parseFuncData({ filterInfo, func2id, id2func }){
        let occurMap = new Map()
        id2func.forEach(x=>{
            occurMap.set( x, 0)
        })
        this.funcEvoluaiton = [...Array(func2id.size)].map((_,i)=>({
            circles: [],
            lines: [],
            name: id2func[i]
        }))
        filterInfo.forEach((lfsVersion,i)=>{
            for (let name in lfsVersion){
                let func = lfsVersion[name]
                if(func.changed ){
                    occurMap.set( name, 1 )
                    let fid = func2id.get(name)
                    this.funcEvoluaiton[fid].circles.push({
                        ...func,
                        vid: i,
                        virtual: false
                    })
                }else if(!occurMap.get(name) ){
                    occurMap.set( name, 1 )
                    let fid = func2id.get(name)
                    this.funcEvoluaiton[fid].circles.push({
                        ...func,
                        vid: i,
                        virtual: true
                    })
                }
            }
        })
        d3.range(0,func2id.size).forEach((_, i)=>{
            let line = {
                startVid: -1,
                endVid: -1,
                acc: 0
            }
            this.funcEvoluaiton[i].circles.forEach((circle ,j)=>{
                const { vid, state, accuracy } = circle
                if(state === ADD || j === 0){
                    line.startVid = vid
                    line.acc = accuracy
                    line.name = this.funcEvoluaiton[i].name
                }else{
                    line.endVid = vid
                    this.funcEvoluaiton[i].lines.push({...line})
                    line.startVid = vid
                    line.acc = accuracy
                    line.name = this.funcEvoluaiton[i].name
                }
            })
            // console.log(this.funcEvoluaiton[i])
            if(this.funcEvoluaiton[i].circles.length && this.funcEvoluaiton[i].circles.slice(-1)[0].state !== DEL){
                line.endVid = filterInfo.length-1
                this.funcEvoluaiton[i].lines.push({...line})
            }
        })
    }
 
    updateStateLine({filterInfo, func2id, id2func,range}){
        // console.log(filterInfo, func2id, id2func)
        // if(!filterInfo) { filterInfo = funcInfo }
        // console.log(range)
        this.parseFuncData({filterInfo, func2id, id2func})
        const { funcEvoluaiton, width, height, textg, container} = this
        // console.log(funcEvoluaiton)
        let vLen = filterInfo.length
        let funcLen = id2func.length
        let that = this
        this.start = range[0]
        this.xScale.domain(d3.range(vLen)).range(d3.range(vLen).map((x,i)=>{
            return i === 0 ? 0 : (width/(vLen-1))*i
        }))
        // this.xScale.domain(d3.range(vLen)).range([0, width])
        let bandwidth = this.xScale(1) - this.xScale(0)
        // console.log(bandwidth)
        this.yScale.domain(d3.range(funcLen))
        that = this

        this.xAxis
            .transition()
            .duration(100)
            .attr('transform', `translate(0, ${height})`)
            .call(
                d3.axisBottom(this.xScale)
                .tickSize(-height)
                .ticks(vLen)
                .tickPadding(8)
                .tickFormat((d,i)=>{
                    return `1-${range[0]+i+1}`
                })
            )
        d3.selectAll('#version-x text')
            .attr('class', (d,i)=>{
                return `version-${range[0]+i}`
            })
            .on('click', function(d,i){
                that.renderHighlight(range[0]+i)
            })
        
        let funcTextUpdate = textg.selectAll('text')
            .data(id2func)
        
        funcTextUpdate.exit().style('opacity', 0).remove()

        funcTextUpdate
            .enter()
            .append('text')
            .merge(funcTextUpdate)
            .text(d=>d)
            .attr('text-anchor','end')
            .style('font-size', '12px')
            .attr('x', (d,i)=>{
                let cx = this.xScale(funcEvoluaiton[i].circles[0].vid)
                return cx-12
            })
            .attr('y', (d,i)=>{
                return this.yScale(i)+this.yScale.bandwidth()-4
            })
        
        let update = container.selectAll('.func')
            .data(funcEvoluaiton)

            update.exit().style('opacity', 0).remove()

            update.enter()
                .append('g')
                .attr('id', (d,i)=>`func_${i}`)
                .attr('class', 'func contour')
                .merge(update)
                .transition()
                .duration(500)

        funcEvoluaiton.forEach((lfs, i)=>{
            const { lines, circles, name } = lfs
            this.updateLiens(lines, name, i, bandwidth)
            this.updateCircles(circles, name, i, bandwidth)
        })
    }

    renderHighlight(newVid){
        d3.select(`.version-${selectedVersion}`)
            .classed('version-selected', false)
        selectedVersion = newVid
        d3.select(`.version-${selectedVersion}`)
            .classed('version-selected', true)
        
        if(!dataInfoStore[selectedVersion]){
            let version = `1-${selectedVersion+1}`
            let total = exampleNumber
            let labeled = funcVersion[selectedVersion].label_train.filter(x=> x !== -1).length
            let pos = funcVersion[selectedVersion].label_train.filter(x=>x === 1).length
            let neg = funcVersion[selectedVersion].label_train.filter(x=>x === 0).length
            let f1= perfStore[3][selectedVersion]
            dataInfoStore[selectedVersion] = {
                version, total, labeled, pos, neg, f1
            }
        }

        const { version, total, labeled, pos, neg, f1 } = dataInfoStore[selectedVersion]
        $('#version-id').text(version)
        $('#total-count').text(total)
        $('#label-count').text(labeled)
        $('#postive-count').text(pos)
        $('#negtive-count').text(neg)
        $('#precision').text(f1)
        aggregationChart.updateAggregated(points, funcVersion[selectedVersion].label_train, selectedVersion)
    }

    updateLiens(lines, name, i){
        const { xScale, yScale, ccolor } = this
        let linesUpdate = d3.select(`#func_${i}`).selectAll(`.dashed`)
            .data(lines)
                    
        linesUpdate.exit().style('opacity', 0).remove()

        linesUpdate
            .enter()
            .append('line')
            .attr('class', `dashed line-${name}`)
            .attr('id', (d,j)=>`line-${name}-${j}`)
            .merge(linesUpdate)
            .transition()
            .duration(100)
            .attr('x1', d=>{
                return xScale(d.startVid)
            })
            .attr('y1', d=>{
                return yScale(i)+yScale.bandwidth()/2
            })
            .attr('x2', d=>{
                return xScale(d.endVid)
            })
            .attr('y2', d=>{
                return yScale(i)+yScale.bandwidth()/2
            })
            .attr('stroke', d=>{
                return '#ccc'
            })
            .attr("stroke-width", "1.5px");


        // 这条是为了辅助交互的线

        let assistUpdate = d3.select(`#func_${i}`).selectAll('.assist')
            .data(lines)

            assistUpdate.exit().style('opacity', 0).remove()

            assistUpdate
                .enter()
                .append('line')
                .attr('class', `assist`)
                .attr('id', (d,j)=>`assist-${name}-${j}`)
                .on('mouseover', function(e,j){
                    // console.log(e)
                    d3.selectAll(`.line-${e.name}`)
                    .attr('stroke', d=>{
                        return '#000'
                    })
                    .attr("stroke-width", "2px");
                })
                .on('mouseout', function(e,j){
                    d3.selectAll(`.line-${e.name}`)
                    .attr('stroke', d=>{
                        return '#ccc'
                    })
                    .attr("stroke-width", "1.5px");
                })
                .merge(assistUpdate)
                .transition()
                .duration(100)
                .attr('x1', d=>{
                    return xScale(d.startVid)
                })
                .attr('y1', d=>{
                    return yScale(i)+yScale.bandwidth()/2
                })
                .attr('x2', d=>{
                    return xScale(d.endVid)
                })
                .attr('y2', d=>{
                    return yScale(i)+yScale.bandwidth()/2
                })
                .attr('stroke', d=>{
                    return 'transparent'
                })
                .attr("stroke-width", "3px");
    }

    updateCircles(circles, name, i){
        circles = circles.filter(c=>c.virtual === false)
        // console.log(circles)
        const { xScale, yScale, ccolor, start } = this
        let circlesUpdate = d3.select(`#func_${i}`).selectAll(`.circle`)
        .data(circles)
    
        // lfs的状态
        circlesUpdate.exit().style('opacity', 0).remove()

        circlesUpdate
            .enter()
            .append('circle')
            .attr('class', `update-circle circle`)
            .attr('id', (d,j)=>{
                return `circle-${name}-${j}`
            })
            .on('mouseover', function(d,j){
                // tooltip
                // .style("display", 'flex');
                // // version、名称、准确率、覆盖率、
                // tooltip.html(`
                //     <div class="tooltip-labels">
                //         <div class="tooltip-label">version:</div>
                //         <div class="tooltip-label">function name:</div>
                //         <div class="tooltip-label">accuracy:</div>
                //         <div class="tooltip-label">coverage:</div>
                //     </div>
                //     <div class="tooltip-values">
                //         <div class="tooltip-value">1-${start+d.vid+1}</div>
                //         <div class="tooltip-value">${name}</div>
                //         <div class="tooltip-value">${d.accuracy? d.accuracy : 0 }</div>
                //         <div class="tooltip-value">${d.coverage? d.coverage : 0}</div>
                //     </div>
                //     `)
                // .style("left", `${d3.event.pageX-50}px`)
                // .style("top", (d3.event.pageY +14) + "px");
            }).on('mouseout', function(d,j){
                tooltip.style('display', 'none')
            })
            .on('click', function(d,j){
                if(j){
                    codeDiff.updateCodeContent({
                        codes: d.codes,
                        lastCodes: circles[j-1].codes
                    })
                }
                // console.log(funcVersion)
                let labelMatrix = funcVersion[start+d.vid].apply_train
                let ids = []
                labelMatrix.forEach((dataLabels,did)=>{
                    if(dataLabels[i] !== -1){
                        ids.push(did)
                    } 
                })
                // console.log(ids)
                textReview.renderTexts(ids)
                aggregationChart.highlightRect(ids)
            })
            .merge(circlesUpdate)
            .transition()
            .duration(100)
            .attr('cx', d=>{
                return this.xScale(d.vid)
            })
            .attr('cy', d=>{
                return this.yScale(i)+this.yScale.bandwidth()/2
            })
            .attr('r', (d,i)=>{
                if(d.state === DEL){
                    if( i ===0 ){
                        return this.rScale(0)
                    }else{
                        let lastd = circles[i-1]
                        return this.rScale(lastd.coverage)
                    }
                }
                return this.rScale(d.coverage)
            })
            .attr('fill', d=>{
                if(d.state === DEL){
                    return '#FFD384'
                }
                return ccolor(d.accuracy)
            })
    }
}