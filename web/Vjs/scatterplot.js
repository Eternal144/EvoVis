class ScatterPlot{
    constructor(){
        this.height = 300
        this.width = 600
        this.radius = 1
        this.margin = { top: 20, left: 0, right: 0, bottom: 10 }
        this.container = d3.select('#aggregate-container')
            .append('svg')
            .attr('id', 'scatterplot')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
        this.xScale = d3.scaleLinear()
            .range([0, this.width])

        this.yScale = d3.scaleLinear()
            .range([this.height, 0])

        this.color = d3.schemeCategory20

        this.xAxis = this.container.append('g')
            .attr('class', 'scatter-axis')
            .attr('id', 'scatter-x')
        this.yAxis = this.container.append('g')
            .attr('class', 'scatter-axis')
            .attr('id', 'scatter-y')
    }

    renderScatter(points, lastLabel){
        const { height, width, radius, color } = this
        this.xScale.domain(d3.extent(points.map(x=>x[0]))).nice()
        this.yScale.domain(d3.extent(points.map(x=>x[1]))).nice()
        // console.log(d3.extent(points.map(x=>x[0])))
        this.xAxis
            .transition()
            .duration(100)
            .attr('transform', `translate(0, ${height})`)
            .call(
                d3.axisBottom(this.xScale)
                .tickSize(-height)
                .ticks(10)
                .tickFormat((d,i)=>'')
            )
        this.yAxis
            .transition()
            .duration(100)
            .call(
                d3.axisLeft(this.yScale)
                .tickSize(-width)
                .ticks(10)
                .tickFormat((d,i)=>'')
            )
        
        let scatterUpdate = this.container
            .selectAll('.data-circle')
            .data(points)

        scatterUpdate.exit().style('opacity', 0).remove()

        scatterUpdate
            .enter()
            .append('circle')
            .attr('class', 'data-circle')
            .on('mouseover', (d)=>{
                // console.log(d)
            })
            .merge(scatterUpdate)
            .attr('cx', (d,i)=>this.xScale(d[0]))
            .attr('cy', (d,i)=>this.yScale(d[1]))
            .attr('r',radius)
            .attr('fill',(d,i)=>{
                return colorMap.get(lastLabel[i]).color
            })
    }
}