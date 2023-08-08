class VersionFilter{
    constructor({ margin,width }){
        this.height = 20
        this.width = width
        this.perfDeltaData = []
        // this.funcInfo = []
        this.initRange = []
        this.margin = margin
        this.container_name = 'version-filter-container'
        this.container = d3.select(`#${this.container_name}`)
            .append('svg')
            .attr('id', `${this.container_name}-svg`)
            .attr('width', this.width+this.margin.left+this.margin.right)
            .attr('height', this.height+this.margin.top+this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left+30}, ${this.margin.top})`)
        this.line_container = this.container.append('g').append('path').attr('class', 'delta-bar-line')
        this.circle_container = this.container.append('g')
        this.filter_container = this.container.append('g')
        this.xScale = d3.scaleBand()
            .range([0, this.width])
        this.yScale = d3.scaleLinear()
            .range([this.height, 0])
        this.xAxis = this.filter_container.append('g')
            .attr('class', `axis ${this.container_name}-axis x-${this.container_name}-axis`)
        this.yAxis = this.filter_container.append('g')
            .attr('class', `axis ${this.container_name}-axis y-${this.container_name}-axis`)
        this.brush = d3.brushX()
            .extent([[0,-10], [this.width, this.height]])
        this.brush_g = this.filter_container.append('g')
            .call(this.brush)  
        this.range = []
        this.curentLfsInfo = [...Array(50)].map(_=>null)
        d3.select('.overlay')
            .style('fill', 'rgb(214, 213, 213)')
            .style('opacity', '0.5')

        d3.select(`#${this.container_name}-svg`)
            .append('text')
            .text('version filter')
        
    }

    getFilterFunc2IdMap(d){
        console.log(d)
        const filterInfo = funcInfo.slice(d[0], d[1])
        this.curentLfsInfo = []
        id2func = []
        func2id = new Map()
        let id = 0
        filterInfo.forEach((lfs,i)=>{
            // const { lfs_name, weights } = funcVersion[d[0]+i]
            for(let name in lfs){
                if(!func2id.has(name)){
                    id2func[id] = name
                    this.curentLfsInfo[id] = {
                        ...lfs[name],
                        version: `1-${d[0]+i+1}`,
                    }
                    func2id.set(name, id++)
                    // curentLfsInfo
                }else{
                    this.curentLfsInfo[func2id.get(name)] = {
                        ...lfs[name],
                        version: `1-${d[0]+i+1}`,
                    }
                    // if(lfs[name].state !== DEL){
                    //     // 如果有了，更新最新的函数信息
                        
                    // }else{
                    //     let last = this.curentLfsInfo[func2id.get(name)]
                    //     this.curentLfsInfo[func2id.get(name)] = {
                    //         ...last,
                    //         version: `1-${d[0]+i+1}`,
                    //         accuracy: 0,
                    //         coverage: 0,
                    //         weight: 0,
                    //         labelsMap: new Map()
                    //     }
                    // }
                }
            }
        })
    }

    updateRange(){
        let that = this
        const { perfDeltaData, height, initRange} = this
        this.xScale.domain(d3.range(funcVersion.length+1))
        this.yScale.domain([0,1])
        const { xScale } = this
        this.xAxis
            .transition()
            .duration(100)
            .attr('transform', `translate(0, ${height})`)
            .call(
                d3.axisBottom(xScale)
                .tickSize(-height-10)
                // .ticks(15)
                .tickValues(xScale.domain().filter(function(d,i){
                    if( perfDeltaData.length > 100 ){
                        return !(i%5)
                    }else if( perfDeltaData.length > 50 ){
                        return !(i%3)
                    }else if( perfDeltaData.length > 30 ){
                        return !(i%2)
                    }else{
                        return 1
                    }
                    
                }))
                .tickFormat((d,i)=>{
                    let id = i+1
                    if( perfDeltaData.length > 100 ){
                        return `1-${id*5}`
                    }else if( perfDeltaData.length > 50 ){
                        return `1-${id*3}`
                    }else if( perfDeltaData.length > 30 ){
                        return `1-${id*2}`
                    }else{
                        return `1-${id}`
                        // return id
                    }
                })
            )
        this.brush
            .on('start', function(){
                // console.log(d3.event.sourceEvent,d3.event.selection)
                if (!d3.event.sourceEvent) return;
                if (!d3.event.selection) return;
                // if (this.range) return;
            })
            .on('brush', function(){
                // if (range) return;
                let d0 = d3.event.selection.map(scaleBandInvert(xScale));
            })
            .on('end', function(){
                if(!d3.event.sourceEvent) return;
                if(!d3.event.selection) return;
                const d = d3.event.selection.map(scaleBandInvert(xScale));
                const bw =xScale.bandwidth()
                d[0] = d3.event.selection[0] % bw > bw*0.5 ?  d[0]+1 : d[0]
                d[1] = d3.event.selection[1] % bw > bw*0.5 ?  d[1]+1 : d[1]
                if(d[1] > funcVersion.length){ d[1] = funcVersion.length }
                d3.select(this).transition().call(d3.event.target.move, [d[0]*xScale.bandwidth(), d[1]*xScale.bandwidth()]);
                selectedRange = d
                that.updateEvolutionView()
            })
        this.updateEvolutionView()
        this.brush_g.call(
            this.brush.move, [selectedRange[0]*xScale.bandwidth(), selectedRange[1]*xScale.bandwidth()]
        )
        // console.log(funcVersion)
    }

    updateEvolutionView(){
        this.getFilterFunc2IdMap(selectedRange)
        zoomLine.updateLfsVerison()
        sankeyFlow.updateSankey()
        perfLine.updatePerformance()
        lfsList.updateTable(this.curentLfsInfo)
    }

    reSetLfsList(){
        const { curentLfsInfo } = this
        lfsList.updateTable(curentLfsInfo)
    }
}

const resetLfs = ()=>{
    versionFilter.reSetLfsList()
}