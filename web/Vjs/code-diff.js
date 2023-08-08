class CodeContentDiff{
    constructor(){
        this.container = d3.select('#code-diff-content')
        this.diffPattern = false
        this.codesLines = []
        this.diffCodesLines = []
        let that = this
        // var slider = document.querySelector('.slider');
        //     slider.addEventListener('click', ()=>{
        //         slider.classList.toggle('active');
        //         this.diffPattern = !this.diffPattern
        //         if(that.diffPattern){
        //             this.updateDiffCodeContent()
        //         }else{
        //             this.updateCodes()
        //         }
        //     });
    }

    getLinesData(codes, lastCodes){
        this.codesLines = codes.split('\n')
        if( lastCodes ){
            let lines = []
            let diff = Diff.diffLines(codes, lastCodes)
            diff.forEach((x,i)=>{
                let arr = x.value.split('\n')
                if(x.added || x.removed){
                    lines.push({
                        ...x
                    })
                }else{
                    d3.range(x.count).forEach(y=>{
                        lines.push({
                            added: false,
                            removed: false,
                            value: `${arr[y]}\n`
                        })
                    })
                }
            })
            this.diffCodesLines = lines
        }
    }
    
    updateCodeContent({codes, lastCodes}){
        this.getLinesData(codes, lastCodes)
        if(this.diffPattern){
            this.updateDiffCodeContent()
        }else{
            this.updateCodes()
            
        }
    }

    updateDiffCodeContent(){
        d3.selectAll('.code-line').remove()
        let old_id = 0
        let new_id = 0
        let update = d3.select('#code-diff-content')
            .selectAll('.code-line')
            .data(this.diffCodesLines)
        
        update.exit().remove()
    
        update
            .enter()
            .append('div')
            .attr('class', 'code-line')
            .classed('code-added', d=>d.added)
            .classed('code-deleted', d=>d.removed)
            .html((d,i)=>{
                let old_flag = false
                let new_flag = false
                if(d.added){
                    new_id++
                    new_flag = true
                }else if(d.removed){
                    old_id++
                    old_flag = true
                }else{
                    new_id++
                    old_id++
                    new_flag = true
                    old_flag = true
                }
                return `<div class='line-number number-left'>${old_flag ? old_id : ''}</div> <div class='line-number number-right'>${new_flag ? new_id : ''}</div><div class="code-value add-padding">${d.value}<div>`
            })   
    }

    // 根据数据和pattern来渲染
    updateCodes(){
        let update = this.container.selectAll('.code-line')
            .data(this.codesLines)
        
        update.exit().style('opacity', 0).remove()

        update.enter()
            .append('div')
            .attr('class', 'code-line')
            .merge(update)
            .classed('code-added', d=>d.added)
            .classed('code-deleted', d=>d.removed)
            .html((d,i)=>{
                return `<div class='line-number'>${i+1}</div><div class="code-value">${d}</div>`
            })
        
    }
}
