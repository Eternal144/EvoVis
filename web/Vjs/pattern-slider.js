const patternSlider = document.getElementById('pattern-slider');
const patternThumb = document.createElement('div');
patternThumb.classList.add('slider-thumb');
patternSlider.appendChild(patternThumb);

const ORIGIN = 0
const MERGE = 1

let pisDragging = false;

function setPatternThumbPosition(position) {
    const patternThumbWidth = patternThumb.offsetWidth;
    const maxPosition = patternSlider.offsetWidth - patternThumbWidth;
    position = Math.max(Math.min(position, maxPosition), 0);
    patternThumb.style.left = `${position}px`;
}

function handlePatternMouseDown(event) {
    pisDragging = true;
}

function handlePatternMouseMove(event) {
  if (pisDragging) {
    const position = Math.max(Math.min(event.clientX - patternSlider.getBoundingClientRect().left - patternThumb.offsetWidth / 2, patternSlider.offsetWidth - patternThumb.offsetWidth), 0);
    console.log(position)
    setPatternThumbPosition(position);
  }
}

function handlePatternMouseUp(event) {
    pisDragging = false;
  
    const x = parseFloat(patternThumb.style.left) + patternThumb.offsetWidth / 2;
    const width = patternSlider.offsetWidth;
    if (x < width * 0.5) {
        zoomLine.updatePattern(MERGE)
        setPatternThumbPosition(0);
    } else{
        zoomLine.updatePattern(ORIGIN)
        setPatternThumbPosition(width - patternThumb.offsetWidth);
    }
  }


patternThumb.addEventListener('mousedown', handlePatternMouseDown);
patternThumb.addEventListener('mousemove', handlePatternMouseMove);
patternThumb.addEventListener('mouseup', handlePatternMouseUp);
