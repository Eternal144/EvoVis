const filterSlider = document.getElementById('filter-slider');
const sliderThumb = document.createElement('div');
sliderThumb.classList.add('slider-thumb');
filterSlider.appendChild(sliderThumb);

// const ORIGIN = 0
// const MERGE = 1

let filterPisDragging = false;

function setsliderThumbPosition(position) {
    const sliderThumbWidth = sliderThumb.offsetWidth;
    const maxPosition = filterSlider.offsetWidth - sliderThumbWidth;
    position = Math.max(Math.min(position, maxPosition), 0);
    sliderThumb.style.left = `${position}px`;
}

function handleFilterMouseDown(event) {
    filterPisDragging = true;
}

function handleFilterMouseMove(event) {
  if (filterPisDragging) {
    const position = Math.max(Math.min(event.clientX - filterSlider.getBoundingClientRect().left - sliderThumb.offsetWidth / 2, filterSlider.offsetWidth - sliderThumb.offsetWidth), 0);
    // console.log(position)
    setsliderThumbPosition(position);
  }
}

function handleFilterMouseUp(event) {
    filterPisDragging = false;
  
    const x = parseFloat(sliderThumb.style.left) + sliderThumb.offsetWidth / 2;
    const width = filterSlider.offsetWidth;
    if (x < width * 0.5) {
        // 不修正，就是全部的数据
        funcPortionPie.renderEntireText()
        setsliderThumbPosition(0);
    } else{
        // 筛选不一致的数据
        funcPortionPie.renderFilterText()
        setsliderThumbPosition(width - sliderThumb.offsetWidth);
    }
  }


sliderThumb.addEventListener('mousedown', handleFilterMouseDown);
sliderThumb.addEventListener('mousemove', handleFilterMouseMove);
sliderThumb.addEventListener('mouseup', handleFilterMouseUp);

// setPatternThumbPosition(0)