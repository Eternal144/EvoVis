function startCountdown(duration, display) {
    let timer = duration, minutes, seconds;
    setInterval(function () {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);
  
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
  
      display.textContent = minutes + ":" + seconds;
  
      if (--timer < 0) {
        // Timer has reached 0, do something here (e.g., show a message)
        display.textContent = "Time's up!";
        // If you want to stop the countdown after it reaches 0, uncomment the line below
        // clearInterval(timerInterval);
      }
    }, 1000);
  }
  
// Call the startCountdown function when the page loads
document.addEventListener("DOMContentLoaded", function () {
    const display = document.getElementById("timer");
    const duration = 30 * 60; // 30 minutes in seconds

    startCountdown(duration, display);
});