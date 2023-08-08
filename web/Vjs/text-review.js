class TextReview{
    constructor(){
        this.container = $('#text-review-container')
    }
    
    renderTexts(ids){
        let labels = funcVersion[selectedVersion].label_train
        let filterTexts = ids.map(id=>({ text: texts[id].text, id }))
        this.container.empty()
        let textUpdate = d3.select('#text-review-container')
            .selectAll('.text-card')
            .data(filterTexts)

        $('#text-count-value').text(ids.length)

        textUpdate.exit().remove()

        textUpdate
            .enter()
            .append('div')
            .attr('class', 'text-card')
            .attr('id', d=>`text-review-${d.id}`)
            .html((d)=>{
                // console.log(d)
                const { id, text } = d
                let str = `<div class='text-id'>${id}:</div>
                <div class="text-container">
                    <div class='text-detail'>${text}</div>
                </div>
                `
                return str
            })
            .style('background', (d,i)=>{
                // console.log(labels[d.id],colorMap.get(labels[d.id]))
                return colorMap.get(labels[d.id]).opacityColor
            })
        
        ids.forEach((id,i)=>{
            let labels = funcVersion[selectedVersion].apply_train[id]
            let tagData = []
            labels.map((label,k)=>{
                if(label !== -1){
                    tagData.push({
                        name: `${funcVersion[selectedVersion].lfs_name[k]}`,
                        label
                    })
                }
            })
            
            d3.select(`#text-review-${id}>.text-container`)
                .append('div')
                .attr('class', 'text-tag-container')
                .selectAll('.text-tag')
                .data(tagData)
                .enter()
                .append('div')
                .attr('class', 'text-tag')
                .html((d,i)=>{
                    let color = colorMap.get(d.label).color
                    // let d.name
                    return `<div class='tag' style='background: ${color}'>${d.name}</div>`
                }
               
                )
                .on('click', (d,i)=>{
                    updateCodeByName(d.name)
                })
        })
    }
}