## VICE Google Analytics Debugger Chrome Extension

### How to install
1. Download the latest release copy and unzip it.
2. Open Chrome browser and go to `chrome://extensions/`
3. Make sure the `Developer mode` box is checked off:
![Screenshot 1](./assets/readme-screenshot-1.png)
4. Click on `Load unpacked extension`:
![Screenshot 2](./assets/readme-screenshot-2.png)
5. Locate the unpacked extension file and select the `build` folder.  
*The app is built with react so the other files are needed to compile the extension*


### How to use
1. Open Chrome browser
2. Load a `vice.com` website, then click on the VICE Icon in the Chrome Extensions
![Screenshot 3](./assets/readme-screenshot-3.png)
3. Look for Google Analytics Network calls
![Screenshot 4](./assets/readme-screenshot-4.png)

### Options
By default the extension will use generic labels for Custom Dimensions, Custom Metrics, and Content Groups.  

These generic labels can be updated to reflect the actual GA mappings.

1. Go to the file `public/gaConfg.json` and copy the JSON object
2. Then right click on the Chrome Extension and select the Options setting
![Screenshot 5](./assets/readme-screenshot-5.png)
3. Paste the JSON object into the text box and hit save.
![Screenshot 6](./assets/readme-screenshot-6.png)
