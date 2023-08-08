// 选中的标注函数，可以update

class SelectedView{
    constructor(){
        // this.container = $('.selected-lfs-cards')
        this.container = d3.select('.selected-lfs-cards')
        
    }
    updateSelected(){
        
        // this.container.empty()
        let lfsUpdate = this.container
            .selectAll('.lfs-card')
            .data(selectedLFs)

        lfsUpdate.exit().remove()

        lfsUpdate
            .enter()
            .append('div')
            .attr('class', 'lfs-card')
            .attr('id', d=>`selected-lfs-${d.id}`)
            // .on('mouseover', function(){
            //     d3.select(this).style('background', 'rgba(0,0,0,.2)')
            // })
            // .on('mouseout', function(){
            //     d3.select(this).style('background', 'rgba(0,0,0,.05)')
            // })
            // .on('click',function(d,i){
                // d3.event.stopPropagation();
                // 把里面的div变成textarea
                // textarea.style.height = e.target.scrollHeight + 'px';
                // d3.event.stopPropagation();

                // selectedLFs = selectedLFs.filter(x=>x.id !== d.id)
                // candidateLFs.push(d)
                // candidateView.updateCandidate()
                // d3.select(this).remove()

            // })
            .style('background', (d,i)=>{
                // console.log(labels[d.id],colorMap.get(labels[d.id]))
                return 'rgba(0,0,0,.05)'
            })
            .html((d)=>{
                console.log(d)
                const { id, text } = d
                let tid = `textarea-${d.id}`
                let str = `
                <div class='lfs-id'>${id+1}:</div>
                <div class="lfs-container">
                    <textarea class='lfs-detail' id=${tid}>${text}</textarea>
                </div>
                <div>
                <button class="manage-lfs delete-lfs">delete</delete>
                <button class="manage-lfs update-lfs">update</button>
                <div>
                `
                return str
            })

        this.container.selectAll('.update-lfs')
            .on('click', function() {
                d3.event.stopPropagation();
                let card = d3.select(this.parentNode.parentNode)
                const clickedData = card.datum();
                const textareaContent = card.select('textarea').property('value');
                // console.log(clickedData, textareaContent)
                clickedData.text = textareaContent
                alert('更新成功')
        
                updateFunc('update', clickedData)
                // console.log(clickedData);
            });  
        
        this.container.selectAll('.delete-lfs')
            .on('click', function() {
                d3.event.stopPropagation();
                let card = d3.select(this.parentNode.parentNode)
                const clickedData = card.datum();
                selectedLFs = selectedLFs.filter(x=>x.id !== clickedData.id)
                candidateLFs.push(clickedData)
                candidateView.updateCandidate()
                card.remove()

                updateFunc('del', clickedData)
            });  

    }
}