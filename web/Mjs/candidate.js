// 候选标注函数
class CandidateView{
    constructor(){
        // this.container = $('.candidate-lfs-cards')
        this.container = d3.select('.candidate-lfs-cards')
            
        
    }
    updateCandidate(){
        // this.container.empty()
        let lfsUpdate = this.container
            .selectAll('.lfs-card')
            .data(candidateLFs)
            
        lfsUpdate.exit().remove()

        lfsUpdate
            .enter()
            .append('div')
            .attr('class', 'lfs-card')
            .attr('id', d=>`candidate-lfs-${d.id}`)
            .on('mouseover', function(){
                d3.select(this).style('background', 'rgba(0,0,0,.2)')
            })
            .on('mouseout', function(){
                d3.select(this).style('background', 'rgba(0,0,0,.05)')
            })
            .on('click',function(d,i){
                candidateLFs = candidateLFs.filter(x=>x.id !== d.id)
                selectedLFs.push(d)
                
                selectedView.updateSelected()
                d3.select(this).remove()

                updateFunc('add', d)
            })
            .style('background', (d,i)=>{
                return 'rgba(0,0,0,.05)'
            })
            // .merge(lfsUpdate)
            // .transition()
            // .duration(100)
            .html((d)=>{
                const { id, text } = d
                let str = `
                <div class='lfs-id'>${id+1}:</div>
                <div class="lfs-container">
                    <div class='lfs-detail'>${text}</div>
                </div>
                `
                return str
            })
    }   
}