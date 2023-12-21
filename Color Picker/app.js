//Global Selections and Variables
const colorDivs=document.querySelectorAll('.color');
const generateButton=document.querySelector('.generate');
const sliders=document.querySelectorAll('input[type="range"]');
const currentHexes=document.querySelectorAll(".color h2");
const popup=document.querySelector('.copy-container')
const adjustButton=document.querySelectorAll('.adjust');
const closeadjustment=document.querySelectorAll('.close-adjustment')
const slidercontainer=document.querySelectorAll('.sliders');
const lockbutton=document.querySelectorAll('.lock');
let initialColors; 
// for local storage
let savedPalettes=[]


// Event Listeners
generateButton.addEventListener('click',()=>{
    randomColors();
})

sliders.forEach(slider=>{
    slider.addEventListener('input',hslControls);

})


//update text
colorDivs.forEach((div,index)=>{
    div.addEventListener('change',()=>{
        updateTextUI(index);
    })
})

currentHexes.forEach((hex)=>{
    hex.addEventListener('click',()=>{
        copyToClipboard(hex); // cannot invoke up there, hex cant be passed
    })
})

popup.addEventListener('transitionend',()=>{
    const popupbox=popup.children[0];
    popup.classList.remove('active');
    popupbox.classList.remove('active');
})


adjustButton.forEach((button,index)=>{
    button.addEventListener('click',()=>{
        openAdjustmentPanel(index);
    })
});

lockbutton.forEach((button,index)=>{
    button.addEventListener('click',()=>{
        changetheLock(index);
    })
})

closeadjustment.forEach((button,index)=>{
    button.addEventListener('click',()=>{
        closeAdjustmentPanel(index);
    })
})


// Functions 

function generateHex(){
    // const letters="#0123456789ABCDEF";
    // let hash='#';
    // for(let i=0; i<6; i++){
    //     hash+=letters[Math.floor(Math.random()*16)];
    // }
    // return hash; OLD WAY

    const hexColor=chroma.random();
    return hexColor;
}


function randomColors(){
    //Save initial colors
    initialColors=[];
    colorDivs.forEach((div,index)=>{
        // div gives the .color
        const hexText=div.children[0]; // selected the text from the colors div
        const randomcolor=generateHex();
        if(div.classList.contains('locked')){
            //push in the initial colors
            initialColors.push(hexText.innerText);
            return;
        }else{
            initialColors.push(chroma(randomcolor).hex());
        }


        initialColors.push(chroma(randomcolor).hex());
        // Now update this color and the stuff
        div.style.backgroundColor=randomcolor;
        hexText.innerText=randomcolor;
        checkContrastColor(randomcolor,hexText);
        //Initialize the color sliders
        const color=chroma(randomcolor);
        const sliders=div.querySelectorAll('.sliders input');
        const hue=sliders[0];
        const brightness=sliders[1];
        const saturation=sliders[2];

        colorizeSliders(color,hue,brightness,saturation);
    });

    //Reset Inputs 
    resetInputs();
    adjustButton.forEach((button,index)=>{
        checkContrastColor(initialColors[index],button);
        checkContrastColor(initialColors[index],lockbutton[index])
    })

}   

randomColors();

function checkContrastColor(color, text){
    const luminance=chroma(color).luminance();
    if(luminance>0.5){
        text.style.color="black";
    }
    else{
        text.style.color='white';
    }
}

function colorizeSliders(color,hue,brightness,saturation){
    // Scale saturation 
    const noSaturation=color.set('hsl.s',0); // get the color and desaturate this as much as possible
    const fullSaturation=color.set('hsl.s',1);
    //Now create a scale out of this 
    const scalesaturation=chroma.scale([noSaturation,color,fullSaturation]); // Created a range and a scale out of the color

    //Scale Brightness
    const midBright=color.set('hsl.l',0.5);
    const scaleBrightness=chroma.scale(['black',midBright,'white']);

    //Update input colors 
    saturation.style.backgroundImage=`linear-gradient(to right,${scalesaturation(0)},${scalesaturation(1)})`
    brightness.style.backgroundImage=`linear-gradient(to right,${scaleBrightness(0)},${scaleBrightness(0.5)},${scaleBrightness(2)})`
    
    hue.style.backgroundImage=`linear-gradient(to right,rgb(204,75,75),rgb(204,204,75),rgb(75,204,75),rgb(75,204,204),rgb(75,75,204),rgb(204,75,204),rgb(204,75,75))`
}


function hslControls(event){
    // console.log(event);
    //the data inside the input tag will tell you which colors slider you're using and based on that you can update stuff
    const index=event.target.getAttribute('data-bright') || 
                event.target.getAttribute('data-hue') ||
                event.target.getAttribute('data-sat');
    
    // console.log(event.target) This is the input, go one parent up and you'll find the sliders div which include all the 3 things  
    let getSliders=event.target.parentElement.querySelectorAll('input[type="range"]');
    // sliders gives back a NodeList of 3 properties of the color you're trying to change hue, brightness and saturation of. Since it's a NodeList we can treat it as an Array and use index to select individual values and update it using another function
    // console.log(getSliders);
    const hue=getSliders[0];
    const brightness=getSliders[1];
    const saturation=getSliders[2];

    //const currentBgcolor=colorDivs[index].querySelector("h2").innerText;
    const currentBgcolor=initialColors[index]; // color reference

    let color=chroma(currentBgcolor)
        .set('hsl.s',saturation.value)
        .set('hsl.l',brightness.value)
        .set('hsl.h',hue.value);
    
    colorDivs[index].style.backgroundColor=color;
    colorizeSliders(color,hue,brightness,saturation)
}

function updateTextUI(index){
    const activeDiv=colorDivs[index];
    const color=chroma(activeDiv.style.backgroundColor);
    const textHex=activeDiv.querySelector('h2')
    const icons=activeDiv.querySelectorAll('.controls button');
    textHex.innerText=color.hex();
    // Check contrast
    checkContrastColor(color,textHex);
    for(icon of icons){
        checkContrastColor(color,icon);
    }
}

function resetInputs(){
    const sliders=document.querySelectorAll('.sliders input'); // All the sliders
    sliders.forEach((slider)=>{
        if(slider.name==='hue'){
            const hueColor=initialColors[slider.getAttribute('data-hue')];
            const hueValue=chroma(hueColor).hsl()[0]; //getting the hue
            slider.value=Math.floor(hueValue);
        }

        if(slider.name==='brightness'){
            const brightColor=initialColors[slider.getAttribute('data-bright')];
            const brightValue=chroma(brightColor).hsl()[2]; //getting the hue
            slider.value=Math.floor(brightValue*100)/100;
        }

        if(slider.name==='saturation'){
            const saturationColor=initialColors[slider.getAttribute('data-sat')];
            const saturationValue=chroma(saturationColor).hsl()[1]; //getting the hue
            slider.value=saturationValue;
        }
    })
}

function copyToClipboard(hex){
    const element=document.createElement('textarea')
    element.value=hex.innerText;
    document.body.appendChild(element)
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
    const popupBox=popup.children[0];
    popup.classList.add('active')
    popupBox.classList.add('active')

}

function openAdjustmentPanel(index){
    slidercontainer[index].classList.toggle('active') 
}
function closeAdjustmentPanel(index){
    slidercontainer[index].classList.remove('active');
}

function changetheLock(index) {
    // can also do it with event, const lockSVG=e.target.children[0];
    const activeDiv = colorDivs[index];
    const selectLock = activeDiv.querySelector('.lock');
    activeDiv.classList.toggle('locked');
    if (activeDiv.classList.contains('locked')) {
        selectLock.innerHTML = '<i class="fa-solid fa-lock"></i>';
    } else {
        selectLock.innerHTML = '<i class="fas fa-lock-open"></i>';
    }
}

//Implement Save Palette and Local Storage stuff
const saveButton=document.querySelector('.save')
const submitSave=document.querySelector('.submit-save');
const closeSave=document.querySelector('.close-save');
const saveContainer=document.querySelector('.save-container');
const saveInput=document.querySelector('.save-container input');
const librarycontainer=document.querySelector('.library-container')
const librarybutton=document.querySelector('.library');
const closelibrarybutton=document.querySelector('.close-library');


//Event Listeners 
saveButton.addEventListener('click',openPalette);
closeSave.addEventListener('click',closePalette);
submitSave.addEventListener('click',()=>{
    savePalette();
})

librarybutton.addEventListener('click',openLibrary);
closelibrarybutton.addEventListener('click',CloseLibrary);

function openPalette(event){
    const popup=saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}

function closePalette(event){
    const popup=saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.remove('active');

}

function savePalette(event){
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
    const name=saveInput.value;
    const colors=[];
    currentHexes.forEach((hex)=>{
        colors.push(hex.innerText);
    });
    //Generate object
    let paletteNumber;
    const paletteObjects=JSON.parse(localStorage.getItem('palette'));
    if(paletteObjects){
        paletteNumber=paletteObjects.length;
    }
    else{
        paletteNumber=savedPalettes.length;
    }

    const paletteObj={
        name: name,
        colors:colors,
        number: paletteNumber
    }
    savedPalettes.push(paletteObj);
    

    //Save to Local Storage
    savetoLocal(paletteObj);
    saveInput.value='' //Reset after saving 
    
    //Generate the plaette for library
    const palette=document.createElement('div');
    palette.classList.add('custom-palette');
    
    const title=document.createElement('h4');
    title.innerText=paletteObj.name
    const preview=document.createElement('div');
    preview.classList.add('small-preview');
    paletteObj.colors.forEach((smallcolor)=>{
        const smalldiv=document.createElement('div');
        smalldiv.style.backgroundColor=smallcolor;
        preview.appendChild(smalldiv)
    });
    
    const palettebutton=document.createElement('button');
    palettebutton.classList.add('pick-palette-button');
    palettebutton.classList.add(paletteObj.number);
    palettebutton.innerText="Select"

    //Attach event to the button
    palettebutton.addEventListener('click',e=>{
        CloseLibrary();
        const paletteindex=e.target.classList[1]; // index of the button in the library
        initialColors=[]; // reset
        savedPalettes[paletteindex].colors.forEach((color,index)=>{
            initialColors.push(color);
            colorDivs[index].style.backgroundColor=color;
            const text=colorDivs[index].children[0]; // h2
            checkContrastColor(color,text);
            updateTextUI(index);
        })  
        resetInputs();
    })
    
    //Append to library
    palette.appendChild(title);
    palette.appendChild(preview)
    palette.appendChild(palettebutton);
    librarycontainer.children[0].appendChild(palette);

    closePalette;
}

function savetoLocal(paletteobj){
    let localpalette;
    if(localStorage.getItem('palettes')===null){
        localpalette=[]; // If you don't find create empty array
    }
    else{
        localpalette=JSON.parse(localStorage.getItem('palettes')) //fetch watever is there
    }
    localpalette.push(paletteobj); // add the new thing to the array
    localStorage.setItem('palettes',JSON.stringify(localpalette)); //Key val pair with key being palettes
}


function openLibrary(){
    const popup= librarycontainer.children[0];
    librarycontainer.classList.add('active');
    popup.classList.add('active');
}

function CloseLibrary(){
    const popup= librarycontainer.children[0];
    librarycontainer.classList.remove('active');
    popup.classList.remove('active');
}


function getLocal(){
    if(localStorage.getItem('palettes')===null){
        localStorage=[];
    }
    else{
        const paletteObjects=JSON.parse(localStorage.getItem('palettes'));
        savedPalettes=[...paletteObjects] //Creating a copy
        paletteObjects.forEach(paletteObj=>{
            //Generate the plaette for library
    const palette=document.createElement('div');
    palette.classList.add('custom-palette');
    
    const title=document.createElement('h4');
    title.innerText=paletteObj.name
    const preview=document.createElement('div');
    preview.classList.add('small-preview');
    paletteObj.colors.forEach((smallcolor)=>{
        const smalldiv=document.createElement('div');
        smalldiv.style.backgroundColor=smallcolor;
        preview.appendChild(smalldiv)
    });
    
    const palettebutton=document.createElement('button');
    palettebutton.classList.add('pick-palette-button');
    palettebutton.classList.add(paletteObj.number);
    palettebutton.innerText="Select"

    //Attach event to the button
    palettebutton.addEventListener('click',e=>{
        CloseLibrary();
        const paletteindex=e.target.classList[1]; // index of the button in the library
        initialColors=[]; // reset
        paletteObjects[paletteindex].colors.forEach((color,index)=>{
            initialColors.push(color);
            colorDivs[index].style.backgroundColor=color;
            const text=colorDivs[index].children[0]; // h2
            checkContrastColor(color,text);
            updateTextUI(index);
        })  
        resetInputs();
    })
    
    //Append to library
    palette.appendChild(title);
    palette.appendChild(preview)
    palette.appendChild(palettebutton);
    librarycontainer.children[0].appendChild(palette);

    closePalette;
        })
    }
}


getLocal();
