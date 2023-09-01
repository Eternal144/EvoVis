class PerformanceLine{
    constructor(){
        this.height = 170
        this.width = 330
        this.margin = { top: 30, left: 30, bottom: 10, right: 50 }
        this.container = d3.select(`#performance-container`)
            .append('svg')
            .attr('id', 'performance-container-svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

        this.xScale = d3.scaleBand()
            .range([0, this.width])
        this.yScale = d3.scaleLinear()
            .range([this.height, 0])
        this.xAxis = this.container.append('g')
            .attr('class', 'axis performance-axis performance-axis-x')
        this.yAxis = this.container.append('g')
            .attr('class', 'axis performance-axis performance-axis-y')
        this.lineContainer = this.container.append('g')
        this.circleContainer = this.container.append('g')
        this.filterData = null
        this.rangel = 0
        this.start = 0

        let xLabel = d3.select('#performance-container-svg')
            .append("text")
            .attr("class", "svg-label")
            .attr("text-anchor", "end")
            .attr("x", this.width+this.margin.left+40)
            .attr("y", this.height+this.margin.top-4)
            .text("version");

        let yLabel = d3.select('#performance-container-svg')
            .append("text")
            .attr("class", "svg-label")
            .attr("text-anchor", "start")
            .attr("x", 0)
            .attr("y", 12)
            .attr("dy", ".75em")
            // .attr("transform", "rotate(-90)")
            .text("precision of label model");
    }

    filterPerf(range){
        return perfStore.map(x=>{
            return x.slice(range[0], range[1])
        })
    }

    // 用三分类的方法计算性能值
    updatePerformance(){
        // console.log(selectedRange)
        let range = selectedRange
        this.start = range[0]
        this.rangel = range[1] - range[0]
        this.xScale.domain(d3.range(this.rangel))
        this.filterData = this.filterPerf(range)
        this.updateLine()
    }

    updateLine(){
        const {xScale,  filterData, height, lineContainer, rangel, start } = this
        if(!filterData) return;
        let d = d3.extent(filterData.flat())
        // d = d[1]>0.9 ? d : [d[0], d[1]+0.1] 
        this.yScale.domain([d[0], d[1]+0.15])
        const {yScale} = this
        this.xAxis
            .transition()
            .duration(100)
            .attr('transform', `translate(0, ${height})`)
            .call(
                d3.axisBottom(xScale)
                    .tickSize(4)
                    .tickValues(xScale.domain().filter((d,i)=>{
                        if((rangel) > 100){
                            return !(i%5)
                        }else if (rangel > 50){
                            return !(i%3)
                        }else if(rangel > 18){
                            return !(i%2)
                        }else{
                            return 1
                        }
                    }))
                    .tickFormat((d,i)=>{
                        let id = i+start
                        if((rangel) > 100){
                            return `1-${(id)*5+1}`
                        }else if (rangel > 50){
                            return `1-${(id)*3+1}`
                        }else if(rangel > 18){
                            return `1-${(id)*2+1}`
                        }else{
                            return `1-${id+1}`
                        }
                    })
                    .tickSize(-this.height)
                    .tickSizeOuter(0)

            )
        this.yAxis
            .transition()
            .duration(100)
            .call(
                d3.axisLeft(yScale)
                .tickSize(4)
                .ticks(5)
                .tickSize(-this.width)
                .tickSizeOuter(0)
            )
        
        let perfUpdate = lineContainer.selectAll('.perf')
                .data(filterData)
            
            perfUpdate.exit().style('opacity', 0).remove()

            perfUpdate
                .enter()
                .append('g')
                .merge(perfUpdate)
                .attr('class', 'perf')
                .each(function(d,i){
                    let lineUpdate = d3.select(this).selectAll('.perf-line')
                        .data([d])

                        lineUpdate.exit().remove()

                        lineUpdate.enter()
                        .append('path')
                        .merge(lineUpdate)
                        .attr('class', 'perf-line')
                        .attr('d', function(perf){
                            let line = d3.line()
                                .x((d,i)=>xScale(i)+xScale.bandwidth()/2)
                                .y((d)=>yScale(d))
                            return line(perf)
                        })
                        .attr('fill', 'none')
                        .attr('stroke-width', 1.5)
                        .attr('stroke', (d,j)=>{
                            return colorMap.get(i).color
                        })

                    let circleUpdate = d3.select(this).selectAll('.perf-circle')
                            .data(d)

                        circleUpdate.exit().remove()
                        
                        circleUpdate.enter()
                            .append('circle')
                            .merge(circleUpdate)
                            .attr('class', 'perf-circle')
                            .on('mouseover', function(perf,j){
                                console.log(perf,i)
                                d3.select(this).style('r', 4)

                                const data = [
                                    {
                                        key: 'version',
                                        value: `1-${selectedRange[0]+j+1}`
                                        // value: `1-${selectedVersion+1+j}`
                                    },
                                    {
                                        key: 'label',
                                        value: labelNameList[i]
                                    },
                                    {
                                        key: 'f1_score',
                                        value: perf
                                    }
                                ]
                                renderTooltip(data)
                            })
                            .on('mouseout', function(d,j){
                                d3.select(this).style('r', 2)
                                clearTooltip()
                            })

                            .attr('cx', (d,j)=>xScale(j)+xScale.bandwidth()/2)
                            .attr('cy', (d,j)=>yScale(d))
                            .attr('r', 2)
                            .style('fill', (d,j)=>{
                                return colorMap.get(i).color
                            })

                })

        
    }
}