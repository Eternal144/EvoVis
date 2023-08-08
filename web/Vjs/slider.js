const slider = document.getElementById('slider');
const thumb = document.createElement('div');
thumb.classList.add('slider-thumb');
slider.appendChild(thumb);

let isDragging = false;

function setThumbPosition(position) {
    const thumbWidth = thumb.offsetWidth;
    const maxPosition = slider.offsetWidth - thumbWidth;
    position = Math.max(Math.min(position, maxPosition), 0);
    thumb.style.left = `${position}px`;
}

function setThumbValue(value) {
    const segmentLength = slider.offsetWidth / 3;
    const segmentValue = value / 3;
    const position = segmentValue * segmentLength;
    setThumbPosition(position);
}

function getThumbValue() {
  const position = parseFloat(thumb.style.left);
  const segmentLength = slider.offsetWidth / 3;
  const segmentIndex = Math.floor(position / segmentLength);
  const segmentValue = (position % segmentLength) / segmentLength * 3;
  const value = segmentIndex * 3 + segmentValue;
  return value;
}

function handleMouseDown(event) {
  isDragging = true;
}

function handleMouseMove(event) {
  if (isDragging) {
    const position = Math.max(Math.min(event.clientX - slider.getBoundingClientRect().left - thumb.offsetWidth / 2, slider.offsetWidth - thumb.offsetWidth), 0);
    setThumbPosition(position);
  }
}

function handleMouseUp(event) {
    console.log('handleMouseUp')
    isDragging = false;
    const value = getThumbValue();
    setThumbValue(value);
  
    const x = parseFloat(thumb.style.left) + thumb.offsetWidth / 2;
    const sliderWidth = slider.offsetWidth;
    if (x < sliderWidth * 0.25) {
        aggregationChart.updateAggregated(0)
        setThumbPosition(0);
    } else if (x < sliderWidth * 0.75) {
        aggregationChart.updateAggregated(1)
        setThumbPosition(sliderWidth / 2 - thumb.offsetWidth / 2);
    } else {
        aggregationChart.updateAggregated(2)
        setThumbPosition(sliderWidth - thumb.offsetWidth);
    }
  }

function zoomIn(level){
    const sliderWidth = slider.offsetWidth;
    if(level===1){
        setThumbPosition(sliderWidth / 2 - thumb.offsetWidth / 2);
    }else{
        setThumbPosition(sliderWidth - thumb.offsetWidth);
    }
}
function zoomOut(level){
    const sliderWidth = slider.offsetWidth;
    if(level === 1){
        setThumbPosition(sliderWidth / 2 - thumb.offsetWidth / 2);
    }else{
        setThumbPosition(0);
    }
}

thumb.addEventListener('mousedown', handleMouseDown);
thumb.addEventListener('mousemove', handleMouseMove);
thumb.addEventListener('mouseup', handleMouseUp);
