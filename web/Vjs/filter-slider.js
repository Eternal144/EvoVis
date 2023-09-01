const filterSlider = document.getElementById('filter-slider');
const sliderThumb = document.createElement('div');
sliderThumb.classList.add('slider-thumb');
filterSlider.appendChild(sliderThumb);

// const ORIGIN = 0
// const MERGE = 1

// let filterPisDragging = false;
var filterFlag = false


function handleToggleFilter() {
    filterFlag = !filterFlag
    const sliderThumbWidth = sliderThumb.offsetWidth;
    const maxPosition = filterSlider.offsetWidth - sliderThumbWidth;
    position = filterFlag ? maxPosition : 0
    sliderThumb.style.left = `${position}px`;

    if (filterFlag) {
        funcPortionPie.renderFilterText()
    } else{
        funcPortionPie.renderEntireText()
    }
}

// function handleFilterMouseDown(event) {
//     filterPisDragging = true;
// }

// function handleFilterMouseMove(event) {
//   if (filterPisDragging) {
//     const position = Math.max(Math.min(event.clientX - filterSlider.getBoundingClientRect().left - sliderThumb.offsetWidth / 2, filterSlider.offsetWidth - sliderThumb.offsetWidth), 0);
//     // console.log(position)
//     setsliderThumbPosition(position);
//   }
// }

// function handleFilterMouseUp(event) {
//     filterPisDragging = false;
  
//     const x = parseFloat(sliderThumb.style.left) + sliderThumb.offsetWidth / 2;
//     const width = filterSlider.offsetWidth;

//   }

sliderThumb.addEventListener('click', handleToggleFilter);
// sliderThumb.addEventListener('mousemove', handleFilterMouseMove);
// sliderThumb.addEventListener('mouseup', handleFilterMouseUp);

// sliderThumb.addEventListener('mousedown', handleFilterMouseDown);
// sliderThumb.addEventListener('mousemove', handleFilterMouseMove);
// sliderThumb.addEventListener('mouseup', handleFilterMouseUp);

// setPatternThumbPosition(0)