class ZoomLine{
    constructor({width, margin, container_name}){
        this.width = width
        this.margin = margin
        this.height = 250
        
        this.container = d3.select(`#${container_name}`)
            .append('svg')
            .attr('id', `${container_name}-svg`)
            .attr('width', this.width  + this.margin.left + this.margin.right)
            .attr('height', this.height  + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

        this.container.append("defs").append("SVG:clipPath")
            .attr("id", "clip")
            .append("SVG:rect")
            .attr("width", this.width )
            .attr("height", this.height )
            .attr("x", 0)
            .attr("y", 0);

        this.radius = 4
        this.xScale = d3.scaleLinear()
            .range([0, this.width])
        this.yScale = d3.scaleLinear()
            .domain([-0.1, 1.1])
            .range([this.height, 0])
        this.rScale = d3.scaleQuantize()
            .range(d3.range(3,9))
            // .range(d3.range(2,9).filter(x=>(x%2 === 0)))
        this.xAxis = this.container.append('g')
            .attr('class', 'version-axis')
            .attr('id', 'version-x')
        this.yAxis = this.container.append('g')
            .attr('class', 'version-axis')
            .attr('id', 'version-y')
        this.funcEvoluaiton = []
        this.legendContainer = this.container.append('g')
            .attr('transform', `translate(${this.margin.left+width-10}, 130)`)
        this.versionContainer = this.container.append('g')
            .attr('clip-path', 'url(#clip)')
        this.lineContainer = this.versionContainer.append('g')

        this.scatterContainer = this.versionContainer.append('g').attr('class', 'scatter-container')
        this.mergeContainer = this.scatterContainer.append('g').attr('class', 'merge-conatiner')
        this.labelContainer = this.scatterContainer.append('g').attr('class','label-group')
        this.holdContainer = this.scatterContainer.append('g').attr('class', 'hold-conatiner')
        this.pieContainer = this.scatterContainer.append('g').attr('class', 'pie-conatiner')
        this.scatterTextContainer = this.scatterContainer.append('g').attr('class', 'text-conatiner')
        

        this.originStoreContainer = this.lineContainer.append('g').attr('class', 'origin-circle-container')
        this.rectContainer = this.container.append('rect')
            .attr("width", this.width)
            .attr("height", this.height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .lower()
        this.linkColor = d3.scaleOrdinal(d3.schemeCategory20);
        // this.func2id = null
        this.icon_in_container = this.container.append('g').attr('class', 'zoom-container zoom-in-container')
        this.icon_out_container = this.container.append('g').attr('class', 'zoom-container zoom-out-container')
        d3.xml('../../data/zoom-in.svg', (err, data)=>{
            let zoom_svg = this.icon_in_container.node()
            zoom_svg.appendChild(data.documentElement);

            // console.log()
            let viewBox = d3.select('#zoom-in-icon').attr('viewBox')
            let preserveAspectRatio = d3.select('#zoom-in-icon').attr('preserveAspectRatio')

            zoom_svg.setAttribute("viewBox", viewBox);
            zoom_svg.setAttribute("preserveAspectRatio", preserveAspectRatio);
            zoom_svg.setAttribute("transform", "translate(785, 50)");
            this.icon_in_container.append('text')
                .style('font-size', '12px')
                .attr('x',20)
                .attr('y', 12)
                .text('zoom in')
        })
        d3.xml('../../data/zoom-out.svg', (err, data)=>{
            let zoom_svg = this.icon_out_container.node()
            zoom_svg.appendChild(data.documentElement);

            let viewBox = d3.select('#zoom-out-icon').attr('viewBox')
            let preserveAspectRatio = d3.select('#zoom-out-icon').attr('preserveAspectRatio')

            zoom_svg.setAttribute("viewBox", viewBox);
            zoom_svg.setAttribute("preserveAspectRatio", preserveAspectRatio);
            zoom_svg.setAttribute("transform", "translate(785, 75)");
            this.icon_out_container.append('text')
                .style('font-size', '12px')
                .attr('x',20)
                .attr('y', 12)
                .text('zoom out')

        })
        this.circles = []
        this.circlesMerged = []
        this.linesMerged = []
        this.mids = []
        this.pattern = MERGE
        this.lock = false
        this.fids = []
        d3.select(`#${container_name}-svg`).on('click',()=>{
            this.lock = false
            this.recoverHightLightLFs()
            this.fids = []
            this.mergeFuncEvo()
            this.updateChart()
        })
    }

    highlightPaper(fid){
        this.setLock()
        this.fids.push(fid)
        this.mergeFuncEvo()
        this.updateChart()
        this.highlightLFs()
    }

    highlightBySankey(fids){
        this.setLock()
        this.fids = fids
        this.mergeFuncEvo()
        this.updateChart()
        this.highlightLFs()
    }

    setLock(){
        this.lock = true
    }

    updatePattern(pattern){
        this.pattern = pattern
        this.mergeFuncEvo()
        this.updateChart()
    }

    parseFuncData(filterInfo){
        let occurMap = new Map()
        id2func.forEach(x=>{
            occurMap.set(x, 0)
        })
        let circles = []
        filterInfo.forEach((lfsVersion,i)=>{
            for (let name in lfsVersion){
                let func = lfsVersion[name]
                let fid = func2id.get(name)
                let acc = func.accuracy
                // let acc = func.accuracy === 1 ? func.accuracy - Math.random()*0.3 : func.accuracy
                if( func.state !== DEL ){
                    circles.push({
                        info:{
                            ...func,
                            accuracy: acc
                        },
                        vid: i,
                        fid,
                    })
                }
            }
        })
        return circles
    }

    mergeFuncEvo( ){
        const { radius, circles,xScale, yScale, pattern, fids} = this
        let newCircles = circles.map((c)=>{
            let x = xScale(c.vid)
            let y = yScale(c.info.accuracy.avg)
            return {
                ...c,
                x,
                y,
            }
        })
        let groupX = d3.nest().key(d=>d.x).entries(newCircles)
        let circlesMerged = []
        groupX.forEach(vdata=>{
            const { values } = vdata
            values.sort((a,b)=>(a.y-b.y))
            let lasty = -100000
            let mergeValues = []
            // 找到需要merge的节点
            values.forEach((c,i)=>{
                if(fids.findIndex(fid=> fid === c.fid) !== -1){ 
                    return;
                }
                if(Math.abs(c.y - lasty) < radius){
                    c.merge = true
                }
                lasty = c.y
            })
            // 进行merge操作
            values.forEach((c,i)=>{
                if( fids.findIndex(fid=> fid === c.fid) !== -1){
                    mergeValues.unshift([c])
                    return;
                }
                if(!c.merge){
                    mergeValues.push([c])
                }else{
                    mergeValues[mergeValues.length-1].push(c)
                }
            })
            // 获取平均的accuracy
            mergeValues.forEach(point=>{
                if(point.length > 1){
                    let totalAcc = d3.sum(point, d=>d.info.accuracy.avg)
                    circlesMerged.push({
                        x: point[0].x,
                        y: yScale(totalAcc/point.length),
                        count: point.length,
                        merge: true,
                        infoList: point,
                        vid: point[0].vid,
                    })
                }else{
                    circlesMerged.push({ ...point[0] })
                }
            })
        })
        
        // 在这里连接link
        let groupMerged = d3.nest().key(d=>d.vid).entries(circlesMerged)
        let linesMerged = []
        groupMerged.forEach((c,i)=>{
            c.values.forEach((mergeNode,j)=>{
                if(mergeNode.merge){
                    mergeNode.infoList.forEach((node,k)=>{
                        linesMerged.push({
                            x: node.x,
                            // y: node.y,
                            y: pattern === ORIGIN ? node.y : mergeNode.y,
                            fid: node.fid
                        })
                    })
                }else{
                    linesMerged.push({
                        x: mergeNode.x,
                        y: mergeNode.y,
                        fid: mergeNode.fid
                    })
                }
            })
        })
        this.circlesMerged = circlesMerged
        this.linesMerged = linesMerged
    }

    updateLfsVerison(){
        const filterInfo = funcInfo.slice(selectedRange[0], selectedRange[1])
        let vlen = filterInfo.length
        let flen = id2func.length
        let that = this
        this.start = selectedRange[0]
        this.xScale.domain([-0.2,vlen-0.5])
        this.circles = this.parseFuncData(filterInfo)
        const { width, height,xScale, yScale } = this
        this.mergeFuncEvo(xScale, yScale, flen)
        this.xAxis
            .attr('transform', `translate(0, ${height})`)
            .call(
                d3.axisBottom(xScale)
                .tickSize(-height)
                .ticks(vlen)
                .tickFormat((d,i)=>{
                    return `1-${selectedRange[0]+i+1}`
                })
            )

        this.yAxis
            .call(d3.axisLeft(yScale)
            .ticks(3))
        this.rScale.domain([Math.log(1), Math.log(8000)])

        d3.selectAll('#version-x text')
            .attr('class', (d,i)=>{
                return `version-${selectedRange[0]+i}`
            })
            .style('user-select','none')
            .on('click', function(d,i){
                d3.event.stopPropagation();
                that.changeSelected(selectedRange[0] + i)
            })

        this.updateChart()
        let zoom = d3.zoom()
        .scaleExtent([.6, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
        .extent([[0, 0], [width, height]])
        .on('zoom', ()=>{
            // recover the new scale
           this.xScale = d3.event.transform.rescaleX(xScale);
           this.yScale = d3.event.transform.rescaleY(yScale);
           // update axes with these new boundaries
           this.xAxis
                .call(
                    d3.axisBottom(this.xScale)
                    .tickSize(-height)
                    .tickFormat((d,i)=>{
                        if(Number.isInteger(d)){
                            return `1-${selectedRange[0]+d+1}`
                        }
                    })
                    )
           this.yAxis.call(d3.axisLeft(this.yScale).ticks(5))

        //    this.container.selectAll("#version-x .tick")
        //        .each(function() {
        //            if (d3.select(this).select("text").text() == "") {
        //                d3.select(this).style("display", "none");
        //            } else {
        //                d3.select(this).style("display", "");
        //             }
        //         })
            d3.selectAll('#version-x text')
            .attr('class', (d,i)=>{
                return `version-${selectedRange[0]+d}`
            })
            .each(function(d,i){
                if(selectedRange[0]+d === selectedVersion){
                    d3.select(this).classed('version-selected', true)
                }
            })
            .style('user-select','none')
            .on('click', (d,i)=>{
                this.changeSelected(selectedRange[0]+d)
            })

            this.mergeFuncEvo()
            this.updateChart()
            
            if(this.fids.length){
                this.highlightLFs()
            }
        }
        )
        this.rectContainer.call(zoom);
        this.renderLegend()
        this.changeSelected(selectedRange[1]-1)
    }

    renderLegend(){
        const { legendContainer, rScale } = this
        legendContainer.selectAll('.legend-item').remove()
        // let maxR = (rScale.range()).slice(-1)[0]
        let items = legendContainer.selectAll('.legend-item')
            .data(rScale.range())
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d,i)=>`translate(0,${i * 20})`)
            items.exit().remove()

        items.append('circle')
            .attr('cx', (d,i)=>{
                return 0
            })
            .attr('cy', (d,i)=>10-d/2)
            .attr('r', (d,i)=>d)
            .attr('fill', '#ccc')
        
        items.append('text')
            .attr('x', (d)=>14)
            .attr('y', (d)=>11)
            .style('font-size', '12px')
            .attr('text-anchor', 'start')
            .text(function(d) {
                return Math.ceil(Math.exp(rScale.invertExtent(d)[1]));
            });
    }

    changeSelected(newVid){
        d3.select(`.version-${selectedVersion}`)
            .classed('version-selected', false)
        selectedVersion = newVid
        d3.select(`.version-${selectedVersion}`)
            .classed('version-selected', true)
        if(!dataInfoStore[selectedVersion]){
            let version = `1-${selectedVersion+1}`
            let labeled = funcVersion[selectedVersion].label_train.filter(x=> x !== -1).length
            let f1= d3.mean(funcVersion[selectedVersion].model_performance)

            let LfsNumber = Object.keys(funcInfo[selectedVersion]).length
            let labelsNumber = d3.range(colorMap.size - 1).map(x=>{
                return funcVersion[selectedVersion].label_train.filter(y=>y === x).length
            })

            dataInfoStore[selectedVersion] = {
                version, labeled, f1,LfsNumber,labelsNumber
            }
        }
        const { version, labeled, f1,LfsNumber,labelsNumber } = dataInfoStore[selectedVersion]
        $('#version-id').text(version)
        $('#label-count').text(labeled)
        $('#precision').text(f1.toFixed(2))
        $('#Lfs-number').text(LfsNumber)
        labelsNumber.forEach((x,i)=>{
            $(`#label-${i}`).text(x)
        })
        
        aggregationChart.updateAggregated(1)
        // 更新完整的数据，但当我只想研究某一个函数时，应该放大它的比例, global trigger mark
        relationPie.renderBurst(selectedVersion)


        updateCodeByVersion(selectedVersion)
        // 以后不是更新最新版本的
        let lfs = []
        for(let name in funcInfo[selectedVersion]){
        // if( funcInfo[selectedVersion][name].state !== DEL ){
            lfs.push({...funcInfo[selectedVersion][name], version: `1-${selectedVersion+1}` })
        // }
        } 
        lfsList.updateTable(lfs)
    }

    updateChart(){
        const pieData = this.getPieData()
        const mergeData = this.getMergeData()
        const originData = this.getHoldData()
        
        this.updatePie(pieData)
        this.updateMergeNode(mergeData)
        this.updateOriginNode(originData)
        this.updateLiens()
    }

    updateLiens(){
        const { lineContainer, linesMerged } = this
        let isHovered = false;
        let timer;
        let that = this;
        let labelTexts = []
        
        let lineGenerator = d3.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .curve(d3.curveCardinal);

        lineContainer.selectAll(`.link-container`).remove()

        let lineGroup = d3.nest().key(d=>d.fid).entries(linesMerged)
        let linesUpdate = lineContainer.selectAll('.link-container')
            .data(lineGroup)

            linesUpdate.enter()
                .append('g')
                .attr('class', 'link-container')
                .merge(linesUpdate)
                .attr('id', (d,i)=>`link-${d.key}`)
                .each(function(link,i){
                    let data = []
                    let fid = link.key
                    link.values.forEach((l,j)=>{
                        data.push({
                            x: l.x,
                            y: l.y
                        })                
                    })
                    // `#link-${links.key}`
                    const linkUpdate =  d3.select(this).selectAll('.link').data([data])
                        linkUpdate.exit().style('opacity', 0).remove()
                        linkUpdate
                            .enter()
                            .append('path')
                            .merge(linkUpdate)
                            .attr('id', (d,i)=>`path-${fid}`)
                            .attr('class', 'connect-link')
                            .attr('d', lineGenerator(data))
                            .attr('stroke', d=>{
                                return '#ccc'
                            })
                            .style("stroke-opacity", .8)
                            .attr('stroke-width', 1.5)
                            .attr('fill', 'none')
                            .on('mouseover', (d,i)=>{
                                // if(that.lock){return;}
                                // isHovered = true;
                                // timer = d3.timeout(()=> {
                                //     if (isHovered) {
                                //         that.highlightLFs(fid) 
                                //     }
                                // }, 500);
                            })
                            .on('click', (d,i)=>{
                                d3.event.stopPropagation()
                                that.fids.push(+fid)
                                that.mergeFuncEvo()
                                that.highlightLFs() 
                                that.lock = true;
                                // if(that.lock){return;}
                                // if (timer) timer.stop();
                                // isHovered = false;
                                // that.recoverHightLightLFs()                            
                            })
                            // .on('mouseout', (d,i)=>{
                            //     if(that.lock){return;}
                            //     if (timer) timer.stop();
                            //     isHovered = false;
                            //     that.recoverHightLightLFs()                            
                            // })

                    let path = d3.select(`#path-${fid}`)
                    const { x,y } = link.values[0]
                    labelTexts.push({
                        label: `${(+fid)+1}-${id2func[+fid]}`,
                        x: x+6,
                        y: y+8,
                        fid
                    })
                })
        this.updateLabels(labelTexts)
    }

    updateLabels(annotations){
        const { labelContainer } = this
        // // 过滤掉发生重叠的注释
        const filteredList = annotations.filter((d, i, arr) => {
            return arr.every((e, j) => {
              if (i === j) return true; // 跳过自身
              const distX = Math.abs(d.x - e.x);
              const distY = Math.abs(d.y - e.y);
              const minDist = d.x < e.x ? d.label.length*5 : e.label.length*5
                return distX>minDist || distY>10
            });
          });
          
        //   console.log(filteredList); // 输出过滤后的列表

          let update = labelContainer.selectAll('.link-annotation').data(filteredList)
            update.exit().remove()
            update
                .enter()
                .append('text')
                .attr('class', 'link-annotation')
                .merge(update)
                .attr('id', (d,i)=>`link-annotation-${d.fid}`)
                .attr('x', d=>d.x)
                .attr('y', d=>d.y)
                .attr('text-anchor', 'start')
                .attr('alignment-baseline', 'central')
                .attr('font-size', '10px')
                .attr('fill', '#777')
                .style('user-select', 'none')
                .style('font-weight', 500)
                .text(d=>d.label)
    }

    highlightLFs(fid){
        const { circlesMerged, pattern, fids} = this
        this.mids = []
        let changedNodes = []
        let holdNodes = []
        const mergeCircles = circlesMerged.filter(x=>{
            return x.merge
        })
        
        mergeCircles.forEach((mergeList,i)=>{
            const { infoList } = mergeList
            infoList.forEach(x=>{
                if(x.fid === (+fid)){
                    this.mids.push({
                        vid: mergeList.vid,
                        fid: x.fid,
                        y: pattern === ORIGIN ? x.y : mergeList.y
                    })
                    if(x.info.changed){
                        changedNodes.push({...x,
                            y: pattern === ORIGIN ? x.y : mergeList.y,
                            merge: false})
                    }else{
                        holdNodes.push({ ...x, 
                            y: pattern === ORIGIN ? x.y : mergeList.y,
                        })
                    }
                }
            })
        })

        d3.selectAll(`.connect-link`)
        .style("stroke-opacity", 0.1)

        fids.forEach((fid)=>{
            d3.select(`#path-${fid}`)
            .style("stroke-opacity", 1)
            .attr('stroke-width', 3)
        })

        this.updatePie(this.getPieData(circlesMerged.concat(changedNodes)))

        d3.selectAll(`.circle`)
            .style('fill-opacity', .1)
        fids.forEach((fid)=>{
            d3.selectAll(`.circle-fid-${fid}`)
            .style('fill-opacity', 1)
        })
        
        
        
        d3.selectAll('.pie-circle')
                .style('opacity', .1)
        fids.forEach((fid)=>{
            d3.selectAll(`.pie-fid-${fid}`)
            .style("opacity", 1)
        })
            


        this.mids.forEach(circle=>{
            const { vid, fid } = circle
            // d3.select(`.merge-vid-${vid}.merge-fid-${fid}`)
            //     .style('display', 'none')
                
            // d3.select(`.text-vid-${vid}.text-fid-${fid}`)
            //     .style('display', 'none')
        })
        holdNodes.forEach(x=>{
        this.originStoreContainer.append('circle')
            .attr('class', 'origin-circle')
            .attr('cx', x.x)
            .attr('cy', x.y)
            .attr('fill','#CCC')
            .attr('r', 2)  
        })

        //暗掉除了fid之外的annotation
        d3.selectAll('.link-annotation')
            .style('opacity', .1)

        fids.forEach((fid)=>{
            d3.select(`#link-annotation-${fid}`)
            .style('opacity', 1)
        })
        
        
    }

    recoverHightLightLFs(){
        const { circlesMerged } = this
        d3.selectAll('.origin-circle').remove()
        this.updatePie(this.getPieData(circlesMerged))
        
        d3.selectAll(`.circle`)
            .style('fill-opacity', 1)
        d3.selectAll(`.connect-link`)
            .style("stroke-opacity", 0.8)
            .attr('stroke-width', 1.5)
        d3.selectAll('.pie-circle')
            .style('opacity', 1)
        
        this.mids.forEach(circle=>{
            const { vid, fid } = circle
            d3.select(`.merge-vid-${vid}.merge-fid-${fid}`)
                .style('display', null)
                
            d3.select(`.text-vid-${vid}.text-fid-${fid}`)
                .style('display', null)
        })
        
        d3.selectAll('.link-annotation').style('opacity', 1)
    }

    getPieData(concatCircles){
        const { rScale, circlesMerged } = this
        let renderCircles = []
        if (concatCircles) { renderCircles = concatCircles }
        else { renderCircles = circlesMerged }
        let filterData = []
        renderCircles.forEach(x=>{
            if(!x.merge && x.info.changed){
                let data = []
                let radius = 0
                x.info.labelsMap.forEach((v,k)=>{
                    data.push({
                        label: k,
                        number: v.length
                    })
                })
                // console.log(Math.log(x.info.totalLabel), x.info.totalLabel)
                radius = rScale(Math.log(x.info.totalLabel))
                filterData.push({
                    ...x,
                    data,
                    radius
                })
            }
        })
        return filterData
    }

    getMergeData(){
        const { rScale, circlesMerged } = this
        let filterData = []
        circlesMerged.forEach(x=>{
            if(x.merge){
                let flagList = [...Array(exampleNumber)].map(_=>0)
                let totalLabel = 0
                x.infoList.forEach(node=>{
                    let map = node.info.labelsMap
                        map.forEach((v,k)=>{
                            v.forEach(lid=>{
                                flagList[lid] = 1
                            })
                        })
                })
                flagList.forEach((x)=>{ if(x){ totalLabel++ } })
                filterData.push({
                    ...x,
                    radius: rScale(Math.log(totalLabel)),
                    labelCount: totalLabel
                })
            }
        })
        return filterData
    }

    getHoldData(){
        const { circlesMerged } = this
        let filterData = []
        circlesMerged.forEach(x=>{
            if(!x.merge && !x.info.changed){
                filterData.push({
                    ...x,
                    radius: 2
                })
            }
        })
        return filterData
    }

    updateMergeNode(data){
        const { mergeContainer, scatterTextContainer, lock } = this
        let mergeUpdate = mergeContainer.selectAll('.merge-g')
            .data(data)

            mergeUpdate.exit().style('opacity', 0).remove()

        mergeUpdate
                .enter()
                .append('g')
                .attr('class', 'merge-g')
                .merge(mergeUpdate)
                .attr('id', (d,i)=>`merge-g-${i}`)
                .on('mouseover', (d,j)=>{
                    if (this.lock){ return; }
                    const { infoList } = d
                    let accList = infoList.map(x=>{
                        return x.info.accuracy.avg
                    })
                    let cvgList = infoList.map(x=>{
                        return x.info.coverage
                    })
                    const data = [
                        {
                            key: 'LFs count',
                            value: infoList.length
                        },
                        {
                            key: 'Label count',
                            value: d.labelCount
                        },
                        {
                            key: 'LFs list',
                            value: infoList.map(x=>x.info.name).join(',')
                        },
                        {
                            key: 'acc_avg',
                            value: d3.mean(accList).toFixed(2)
                        },
                        {
                            key: 'coverage_avg',
                            value: d3.mean(cvgList).toFixed(2)
                        },
                    ]
                    renderTooltip(data)
                })
                .on('mouseout', (d,j)=>{
                    if (this.lock){ return; }
                    clearTooltip()
                })
                .on('click', function(d,j){
                    d3.event.stopPropagation();
                    let codes = d.infoList.map(x=>{
                        return x.info.codes
                    }).join('\n\n')
                    updateCodeByCodes(codes)
                })
                .each(function(d){
                    let circleUpdate = d3.select(this).selectAll('.circle')
                        .data([d])

                        circleUpdate.exit().remove()

                        circleUpdate.enter()
                            .append('circle')
                            .merge(circleUpdate)
                            .attr('class', (d,i)=>{
                                let str = `circle merge-circle merge-vid-${d.vid} `
                                d.infoList.forEach(x=>{
                                    str += `merge-fid-${x.fid} `
                                })
                                return str
                            })
                            .attr('cx', d=>{
                                return d.x
                            })
                            .attr('cy', d=>{
                                return d.y
                            })
                            .attr('r', (d,i)=>d.radius)
                            .attr('fill', d=>'#333')

                    let textUpdate = d3.select(this).selectAll('.text')
                        .data([d])
                
                        textUpdate.exit().style('opacity', 0).remove()
                        
                        textUpdate.enter()
                            .append('text')
                            .merge(textUpdate)
                            .attr('id', (d,i)=>`text-${i}`)
                            .attr('class', (d,i)=>{
                                let str = `text text-vid-${d.vid} `
                                d.infoList.forEach(x=>{
                                    str += `text-fid-${x.fid} `
                                })
                                return str
                            })
                            .attr('x', d=>{
                                return d.x 
                            })
                            .attr('y', d=>d.y+d.radius/2-1)
                            .text(d=>`${d.infoList.length}`)
                            .style('fill', '#fff')
                            .style('text-anchor', 'middle')
                            .style('font-size', 8)
                            .style("user-select", "none");  
                })
    }

    updatePie(pieDataList){
        const { pieContainer } = this
        pieContainer.selectAll('.pie-container').remove()
        let piesConatinerUpdate = pieContainer.selectAll('.pie-container')
            .data(pieDataList)

            piesConatinerUpdate.exit().style('opacity', 0).remove()

            piesConatinerUpdate
                .enter()
                .append('g')
                .attr('class', 'pie-container')
                .merge(piesConatinerUpdate)
                .attr('id', (d,i)=>`pie-${i}`)
                .attr('transform', (d,i)=>`translate(${d.x}, ${d.y})`)
                .on('mouseover', (d,i)=>{
                    const { accuracy, coverage, name } = d.info
                    let id = funcVersion[d.vid].lfs_name.findIndex(d=>d === name)
                    let ids = []
                    const data = [
                        {key: 'name', value: `${func2id.get(name)+1}-${name}`},
                        {key: 'accuracy', value: accuracy.avg.toFixed(2)},
                        {key: 'coverage', value: coverage.toFixed(2)},
                    ]
                    renderTooltip(data)
                    if (this.lock){ return; }
                    d.info.labelsMap.forEach((v,k)=>{
                        data.push({
                            key: `${colorMap.get(+k).labelName} count`,
                            value: v.length
                        })
                        ids = ids.concat(v)
                    })
                    let f_index = funcVersion[d.vid+selectedRange[0]].lfs_name.findIndex(x=>x === d.info.name)
                    let lfs = funcVersion[d.vid+selectedRange[0]].link2LFs[f_index]
                    sankeyFlow.highlightLink(lfs)
                    aggregationChart.highlightRect(ids) 

                })
                .on('mouseout', (d,i)=>{
                    clearTooltip()
                    if (this.lock){ return; }
                    aggregationChart.clearHighlight()
                    sankeyFlow.clearHighlight()
                })
                .on('click', (d,i)=>{
                    d3.event.stopPropagation();
                    updateCodeByCodes(d.info.codes)
                    let ids = []
                    d.info.labelsMap.forEach((v,k)=>{
                        ids = ids.concat(v)
                    })
                    textReview.renderTexts(ids)
                    let f_index = funcVersion[d.vid+selectedRange[0]].lfs_name.findIndex(x=>x === d.info.name)
                    let lfs = funcVersion[d.vid+selectedRange[0]].link2LFs[f_index]
                    sankeyFlow.highlightLink(lfs)
                    // aggregationChart.setLock()
                    aggregationChart.highlightRect(ids)

                    this.lock = true
                    sankeyFlow.setLock()
                })
            
            pieDataList.forEach((pieData,i)=>{
                const { data,radius } = pieData
                
                let arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);
                
                let pie = d3.pie()
                .value(function(d) { return d.number; })
                .sort(null);
                
                let update = d3.select(`#pie-${i}`)
                    .selectAll('path')
                    .data(pie(data))

                    update.exit().style('opacity',0).remove()

                    update
                    .enter()
                    .append("g")  
                    .append('path')
                    .attr('class', (d,i)=>{
                        return `pie-circle pie-fid-${pieData.fid}`
                    })
                    .attr('d', arc)
                    .attr('fill', (d,i) => {
                        return colorMap.get(+d.data.label).color
                    })
                    .style('stroke', 'white')
            })
    }

    updateOriginNode(data){
        const { holdContainer } = this
        let holdUpdate = holdContainer.selectAll('.circle')
                .data(data)

            holdUpdate.exit().remove()

            holdUpdate
                .enter()
                .append('circle')
                .merge(holdUpdate)
                .attr('class', (d,i)=>`circle circle-fid-${d.fid}`)
                .attr('cx', d=>{
                    return d.x
                })
                .attr('cy', d=>{
                    return d.y
                })
                .attr('r', (d,i)=>d.radius)
                .attr('fill', d=>'#CCC')
                .on('mouseover', (d,i)=>{
                    if (this.lock){ return; }
                    const { accuracy, coverage,name,labelsMap } = d.info
                    let ids = []
                    const data = [
                        {key: 'name', value: `${func2id.get(name) + 1}-${name}`},
                        {key: 'accuracy', value: accuracy.avg.toFixed(2)},
                        {key: 'coverage', value: coverage.toFixed(2)},
                    ]
                    labelsMap.forEach((v,k)=>{
                        data.push({
                            key: `${colorMap.get(+k).labelName} count`,
                            value: v.length
                        })
                        ids = ids.concat(v)
                    })
                    renderTooltip(data)
                    aggregationChart.highlightRect(ids) 
                })
                .on('mouseout', (d,i)=>{
                    if (this.lock){ return; }
                    clearTooltip()
                    aggregationChart.clearHighlight()
                })
                .on('click', (d,i)=>{
                    d3.event.stopPropagation();
                    updateCodeByCodes(d.info.codes)
                    let ids = []
                    d.info.labelsMap.forEach((v,k)=>{
                        ids = ids.concat(v)
                    })
                    textReview.renderTexts(ids)
                })
    }
}