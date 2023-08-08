class LfsPerf{
    constructor(){
        this.margin = { top: 20, bottom: 20, left: 20, right:0 }
        this.width = 80
        this.lfsData = []
        this.container = d3.select('.lfs-performance')
            .append('svg')
            .attr('id', 'lfs-performance')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
        this.xScale = d3.scaleLinear()
            .range([this.width, 0])
        this.yScale = d3.scaleBand()
            .padding(0.2)
        this.xAxis = this.container.append('g')
            .attr('class', 'func-dist-axis x-func-dist-axis')
        this.yAxis = this.container.append('g')
            .attr('class', 'func-dist-axis y-func-dist-axis')
            .attr('transform', `translate(${this.width-10}, 0)`)
        this.color = ['#FFC090', '#7FB77E','#B1D7B4']
        this.compare_container = this.container.append('g')
        this.delta_container = this.container.append('g')

    }
    updateLfsPerf(data){
        const { height } = data
        d3.select('#lfs-performance')
            .attr('height', height + this.margin.top + this.margin.bottom)

        this.lfsData = this.getLfsDiff(data)
        this.xScale.domain([d3.min(this.lfsData, d=>{
            let a = d.cpr_acc === 0 ? 2 : d.cpr_acc
            let b = d.cur_acc === 0 ? 2 : d.cur_acc
            return d3.min([a,b])
        })-0.1,d3.max(this.lfsData, d=>d3.max([d.cpr_acc, d.cur_acc]))])
        this.yScale.domain(d3.range(0,this.lfsData.length)).range([0, height])
        // console.log(this.lfsData)
        this.xAxis
            .transition()
            .duration(100)
            .call( 
                d3.axisTop(this.xScale)
                    .ticks(2)
                    // .tickFormat(d=>'i')
             )
        
        this.yAxis
            .transition()
            .duration(100)
            .call(
                d3.axisRight(this.yScale)
                .ticks(5)
                    
            )
        d3.select('.lfs-performance .y-func-dist-axis .domain')
            .style('display', 'none')
        d3.selectAll('.lfs-performance .y-func-dist-axis .tick')
            .style('display', 'none')
        this.updateCompareLfs()
        this.updateDeltaLfs()  
    }

    updateCompareLfs(){
        const { lfsData, compare_container,xScale, yScale, width,color } = this
        let update = compare_container.selectAll('rect')
            .data(lfsData)

        update.exit().style('opacity', 0).remove()

        update
            .enter()
            .append('rect')
            .attr('class', 'lfs-bar')
            .merge(update)
            .transition()
            .duration(100)
            .attr('x', (d,i)=>{
                return d.cpr_acc === 0 ? width : xScale(d.cpr_acc)
            })
            .attr('y', (d,i)=>yScale(i))
            .attr('width', (d,i)=>{
                return d.cpr_acc === 0 ? 0 :  width - xScale(d.cpr_acc)
            })
            .attr('height', (d,i)=>{
                return yScale.bandwidth()
            })
            .attr('fill', color[2])
    }   

    updateDeltaLfs(){
        const { xScale, yScale, width, color, delta_container, lfsData } = this
        let update = delta_container.selectAll('rect')
            .data(lfsData)
        
        update.exit().style('opacity', 0).remove()

        update
            .enter()
            .append('rect')
            .attr('class', 'lfs-bar')
            .merge(update)
            .transition()
            .duration(100)
            .attr('x', d=>{
                let cur =  d.cur_acc === 0 ? width : xScale(d.cur_acc)
                let cpr = d.cpr_acc === 0 ? width : xScale(d.cpr_acc)
                return d.cur_acc > d.cpr_acc ? cur : cpr
            })
            .attr('y',(d,i)=>yScale(i))
            .attr('width', d=>{
                let cur =  d.cur_acc === 0 ? width : xScale(d.cur_acc)
                let cpr = d.cpr_acc === 0 ? width : xScale(d.cpr_acc)
                return d.cur_acc > d.cpr_acc ? cpr - cur : cur - cpr
            })
            .attr('height',d=>yScale.bandwidth())
            .attr('fill',d=>{
                return d.cur_acc > d.cpr_acc ? color[1] : color[0]
            })
    }

    getLfsDiff(data){
        let lfsData = []
        const { compare_lfs, current_lfs, compare_name, current_name } = data
        current_lfs.forEach((x,i)=>{
            let id = compare_name.findIndex(y => current_name[i] === y)
            if( id === -1){
                lfsData.push({
                    cpr_acc: 0,
                    cur_acc: x
                })
            }else{
                lfsData.push({
                    cpr_acc: compare_lfs[i],
                    cur_acc: x
                })
                compare_name[i] = ''
            }
        })
        compare_lfs.forEach((x,i)=>{
            if(compare_name[i]){
                lfsData.push({
                    cpr_acc: x,
                    cur_acc: 0
                })
            }
        })
        return lfsData
    }
}