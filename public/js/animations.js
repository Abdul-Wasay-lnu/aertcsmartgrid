document.addEventListener("DOMContentLoaded", function() {
   
    var homeAnim = lottie.loadAnimation({
      container: document.getElementById('home'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/animations/Home.json'
    });
  
    var gridAnim = lottie.loadAnimation({
      container: document.getElementById('powerGrid'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/animations/grid.json'
    });
  
   // Array to hold battery animation instances
   var batteryAnims = [];

   // Initialize all battery animations
   for (let i = 1; i <= 6; i++) {
     batteryAnims.push(lottie.loadAnimation({
       container: document.getElementById(`battery-${i}`),
       renderer: 'svg',
       loop: true,
       autoplay: true,
       path: 'assets/animations/battery.json' // Common battery animation file
     }));
   }

   // Function to update battery animation based on percentage
   function updateBatteryAnimation(batteryIndex, percentage) {
    
     const animation = batteryAnims[batteryIndex];

     // Update battery percentage - assuming the Lottie animation has frames representing different charging levels
     // E.g., from 0% to 100%, spread over 0 to 100 frames
     const frame = Math.round((percentage / 100) * animation.totalFrames); // Total frames based on battery percentage
     console.log('Frame:', frame);
     if(percentage==100){
      animation.goToAndStop(frame-1, true); // Go to the frame corresponding to the battery percentage

    }else{
     animation.goToAndStop(frame, true); // Go to the frame corresponding to the battery percentage
    }
     // Update battery color dynamically (you can change the logic based on specific requirements)
     const batteryElement = document.getElementById(`battery-${batteryIndex + 1}`);
   // Update the displayed value for the battery
  const batteryValueElement = document.getElementById(`battery-value-${batteryIndex + 1}`);
  batteryValueElement.textContent = `${percentage} V`; // Update the value text
   }

   // Fetch data from the server and update the animations
   function fetchDataAndUpdate() {
     fetch('/get-latest-data')
       .then(response => response.json())
       .then(data => {
         console.log('Fetched data:', data);

         // Assuming you have battery data in the format { variable: "Battery 1", value: 23 }
         data.forEach(item => {
          //  if (item.variable.startsWith('Battery')) {
          //    const batteryIndex = parseInt(item.variable.split(' ')[1]); // Extract battery number
          //    console.log('Battery index:', batteryIndex);
          //    updateBatteryAnimation(batteryIndex, item.value); // Update battery animation
          //  }
while(item.BatteryIndex<=6){
           console.log('Battery index:', item.BatteryIndex);
           updateBatteryAnimation(item.BatteryIndex, item.value); // Update battery animation
           break;
         }});
       })
       .catch(error => console.error('Error fetching data:', error));
   }

   // Fetch and update the battery every 3 seconds
   setInterval(fetchDataAndUpdate, 3000);
   //fetchDataAndUpdate();
    var invertersAnim = lottie.loadAnimation({
      container: document.getElementById('inverters'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/animations/capacitor.json'
 
    });

    var motorAnim = lottie.loadAnimation({
      container: document.getElementById('motor'),
      renderer: 'mp4',
      loop: true,
      autoplay: true,
      path: 'assets/animations/motor-animation.mp4'
    });
  });
  