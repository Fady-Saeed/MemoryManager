const {electron,remote} = require('electron')
const path = require('path')

const addHoleBtn = document.getElementById('addHole')
const holeStartAddress = document.getElementById('startAddress')
const holeSize = document.getElementById('holeSize')
const holesTbl = document.getElementById('holeTbl')
const holesTblBody = document.getElementById('holesTblBody')

const addProcessBtn = document.getElementById('addProcess')
const pid = document.getElementById('pid')
const pSize = document.getElementById('pSize')
const processTbl = document.getElementById('processTbl')
const processTblBody = document.getElementById('processTblBody')

const memoryChart = document.getElementById('memoryChart')

var maxProcessIndex = 0

var holes = []
var insertedHoles = []
var processes = []

const firstFitOption = document.getElementById('firstFitOption')
const bestFitOption = document.getElementById('bestFitOption')
const algorithm = document.getElementById('algorithm')

var deleteProcessBtns = document.getElementsByClassName('deleteProcess')

const expandButton = document.getElementById("expandButton")
const minimizeButton = document.getElementById("minimizeButton")
const closeButton = document.getElementById("closeButton")

expandButton.addEventListener('click',function(e){
    if(remote.BrowserWindow.getFocusedWindow().isMaximized()){
        remote.BrowserWindow.getFocusedWindow().unmaximize();
    }else{
        remote.BrowserWindow.getFocusedWindow().maximize();
    }
    
})
minimizeButton.addEventListener('click',function(e){
    remote.BrowserWindow.getFocusedWindow().minimize();
})
closeButton.addEventListener('click',function(e){
    remote.getCurrentWindow().close();
})

window.addEventListener('resize', function (e) {
    e.preventDefault()
    resizeMemoryChart(memoryChart)

})

memoryChart.addEventListener('dblclick',function(e){
    if(e.target && e.target.classList.contains("blank")){    
        var cell = findAncestor(e.target,"memoryCell")
        var size = Number(cell.getAttribute("data-size"))
        var start = Number(cell.getAttribute("data-start"))
        
        // Append the Record to the Table
        holesTblBody.innerHTML += `
            <tr>
                <td>${start}</td>
                <td>${size}</td>
            </tr>
        `

        // Append the Record to the Array
        holes.push(new Hole(start, size))
        insertedHoles.push(new Hole(start, size))
        if (processes.length > 0)
            drawHoles(memoryChart, holes, processes, 0)
        else
            drawHoles(memoryChart, holes, processes, 1)

        //changeAlgorithm()
        resizeMemoryChart(memoryChart)
    }
})

processTblBody.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'deleteProcessBtn') {
        var processChartIndex
        var processToBeDeAllocated

        for (var i = 0; i < memoryChart.getElementsByClassName('hasProcess').length; i++) {
            if (memoryChart.getElementsByClassName('hasProcess')[i].getAttribute("data-index") == e.target.getAttribute("data-index")) {
                processToBeDeAllocated = memoryChart.getElementsByClassName('hasProcess')[i]
                processChartIndex = i
                break
            }
        }

        // holes.push(new Hole(processes[Number(e.target.getAttribute("data-index"))].start, processes[Number(e.target.getAttribute("data-index"))].size))
        deAllocateProcess(processes, holes, processChartIndex, processToBeDeAllocated, e)

        for (var i = 0; i < holes.length - 1; i++) {
            if (holes[i + 1].start <= holes[i].end) {
                if (holes[i + 1].end > holes[i].end) {
                    holes[i].end = holes[i + 1].end
                    holes[i].size = holes[i].end - holes[i].start
                }
                holes.splice(i + 1, 1)
                i--
            }
        }

    }
})

function deAllocateAllProcesses(processes, holes, insertedHoles, memoryChart) {
    holes.splice(0, holes.length)
    holes = insertedHoles.slice()
    // holes = [...insertedHoles]
    drawHoles(memoryChart, holes, processes, 1)
    // console.group()
    // console.table(holes)
    // console.table(insertedHoles)
    // console.groupEnd()
    return holes
}

function editHoles(memoryChart, holes, processes) {

}

function deAllocateProcess(processes, holes, processChartIndex, processToBeDeAllocated, e) {
    holes.push(new Hole(processes[processChartIndex].start, processes[processChartIndex].size))
    processes.splice(processChartIndex, 1)
    // const leftProcesses = processTblBody.getElementsByClassName('deleteProcess')
    // for (var i = Number(e.target.getAttribute("data-index")); i < leftProcesses.length - 1; i++)
    //     leftProcesses[i + 1].setAttribute("data-index", i)


    var previousCell = processToBeDeAllocated.previousElementSibling
    var nextCell = processToBeDeAllocated.nextElementSibling

    if (
        (previousCell == null && nextCell == null) ||
        (previousCell == null && nextCell != null && !nextCell.classList.contains('available')) ||
        (previousCell != null && nextCell == null && !previousCell.classList.contains('available')) ||
        (previousCell == null && nextCell != null && !nextCell.classList.contains('available') && !previousCell.classList.contains('available')) ||
        (previousCell != null && nextCell != null && !nextCell.classList.contains('available') && !previousCell.classList.contains('available'))
    ) {
        processToBeDeAllocated.getElementsByClassName('memoryCellProcessId')[0].innerHTML = ""
        processToBeDeAllocated.classList.add('available')
        processToBeDeAllocated.classList.remove('hasProcess')
    }
    else if (
        (previousCell != null && nextCell == null && previousCell.classList.contains('available')) ||
        (previousCell != null && nextCell != null && !nextCell.classList.contains('available') && previousCell.classList.contains('available'))
    ) {
        // if (previousCell.classList.contains('available')) {
        previousCell.setAttribute('data-end', Number(previousCell.getAttribute('data-end')) + Number(processToBeDeAllocated.getAttribute('data-size')))
        previousCell.setAttribute('data-size', Number(previousCell.getAttribute('data-size')) + Number(processToBeDeAllocated.getAttribute('data-size')))
        previousCell.style.height = parseInt(previousCell.style.height, 10) + parseInt(processToBeDeAllocated.style.height, 10) + "%"
        processToBeDeAllocated.remove()
        // }
        // else {
        //     processToBeDeAllocated.getElementsByClassName('memoryCellProcessId')[0].innerHTML = ""
        //     processToBeDeAllocated.classList.add('available')
        //     processToBeDeAllocated.classList.remove('hasProcess')
        // }
    }
    else if (
        (previousCell == null && nextCell != null && nextCell.classList.contains('available')) ||
        (previousCell != null && nextCell != null && nextCell.classList.contains('available') && !previousCell.classList.contains('available'))
    ) {
        // if (nextCell.classList.contains('available')) {
        nextCell.setAttribute('data-start', processToBeDeAllocated.getAttribute('data-start'))
        nextCell.setAttribute('data-end', Number(nextCell.getAttribute('data-end')))
        nextCell.setAttribute('data-size', Number(nextCell.getAttribute('data-size')) + Number(processToBeDeAllocated.getAttribute('data-size')))
        nextCell.style.height = parseInt(nextCell.style.height, 10) + parseInt(processToBeDeAllocated.style.height, 10) + "%"
        processToBeDeAllocated.remove()
        // }
        //  else {
        //     processToBeDeAllocated.getElementsByClassName('memoryCellProcessId')[0].innerHTML = ""
        //     processToBeDeAllocated.classList.add('available')
        //     processToBeDeAllocated.classList.remove('hasProcess')
        // }
    } else {
        if (nextCell.classList.contains('available') && previousCell.classList.contains('available')) {
            processToBeDeAllocated.setAttribute('data-start', previousCell.getAttribute("data-start"))
            processToBeDeAllocated.setAttribute('data-end', nextCell.getAttribute("data-end"))
            processToBeDeAllocated.setAttribute('data-size', Number(processToBeDeAllocated.getAttribute('data-end') - Number(processToBeDeAllocated.getAttribute('data-start'))))
            processToBeDeAllocated.style.height = parseInt(processToBeDeAllocated.style.height, 10) + parseInt(nextCell.style.height, 10) + parseInt(previousCell.style.height, 10) + "%"
            previousCell.remove()
            nextCell.remove()
            processToBeDeAllocated.classList.add('available')
            processToBeDeAllocated.classList.remove('hasProcess')
            processToBeDeAllocated.getElementsByClassName('memoryCellProcessId')[0].innerHTML = ""
        }
        // else if (!nextCell.classList.contains('available') && previousCell.classList.contains('available')) {
        //     previousCell.setAttribute('data-end', Number(previousCell.getAttribute('data-end')) + Number(processToBeDeAllocated.getAttribute('data-size')))
        //     previousCell.setAttribute('data-end', Number(previousCell.getAttribute('data-size')) + Number(processToBeDeAllocated.getAttribute('data-size')))
        //     previousCell.style.height = parseInt(previousCell.style.height,10) + parseInt(processToBeDeAllocated.style.height,10) + "%"
        //     processToBeDeAllocated.remove()
        // } else if (nextCell.classList.contains('available') && !previousCell.classList.contains('available')) {
        //     nextCell.setAttribute('data-end', Number(nextCell.getAttribute('data-end')) + Number(processToBeDeAllocated.getAttribute('data-size')))
        //     nextCell.setAttribute('data-end', Number(nextCell.getAttribute('data-size')) + Number(processToBeDeAllocated.getAttribute('data-size')))
        //     nextCell.style.height = parseInt(nextCell.style.height,10) + parseInt(processToBeDeAllocated.style.height,10) + "%"
        //     processToBeDeAllocated.remove()
        // }
        // else {
        //     processToBeDeAllocated.getElementsByClassName('memoryCellProcessId')[0].innerHTML = ""
        //     processToBeDeAllocated.classList.add('available')
        //     processToBeDeAllocated.classList.remove('hasProcess')
        // }
    }
    findAncestor(e.target, "process").remove()

    holes.sort(function (a, b) {
        return a.start > b.start
    })
}
function changeAlgorithm(){
    holes = deAllocateAllProcesses(processes, holes, insertedHoles, memoryChart)

    maxProcessIndex = 0
    console.table(insertedHoles)
    if (algorithm.value == "firstFit") {
        for (var i = 0; i < processes.length; i++)
            firstFit(holes, memoryChart, processes[i],true)

    }
    else if (algorithm.value == "bestFit") {
        for (var i = 0; i < processes.length; i++)
            bestFit(holes, memoryChart, processes[i],true)
    }
    resizeMemoryChart(memoryChart)
}
algorithm.addEventListener('change', changeAlgorithm)

addHoleBtn.addEventListener('click', function (e) {
    e.preventDefault()
    if (holeStartAddress.value == "" || holeSize.value == "" || isNaN(holeStartAddress.value) || isNaN(holeSize.value)) {
        if (holeStartAddress.value == "" || isNaN(holeStartAddress.value))
            // Add Error CSS Efect to the Input        
            holeStartAddress.parentNode.classList.add('error')
        else
            // Remove Error CSS Efect out of the Input
            holeStartAddress.parentNode.classList.remove('error')

        if (holeSize.value == "" || isNaN(holeSize.value))
            // Add Error CSS Efect to the Input    
            holeSize.parentNode.classList.add('error')
        else
            // Remove Error CSS Efect out of the Input
            holeSize.parentNode.classList.remove('error')
    } else {
        // Remove Error CSS Efect out of the Inputs
        holeStartAddress.parentNode.classList.remove('error')
        holeSize.parentNode.classList.remove('error')

        // Append the Record to the Table
        holesTblBody.innerHTML += `
            <tr>
                <td>${holeStartAddress.value}</td>
                <td>${holeSize.value}</td>
            </tr>
        `

        // Append the Record to the Array
        holes.push(new Hole(Number(holeStartAddress.value), Number(holeSize.value)))
        insertedHoles.push(new Hole(Number(holeStartAddress.value), Number(holeSize.value)))
        if (processes.length > 0)
            drawHoles(memoryChart, holes, processes, 0)
        else
            drawHoles(memoryChart, holes, processes, 1)
        // Reset Input Values
        holeStartAddress.value = ""
        holeSize.value = ""

        // Reset Focus to Hole Start Address Input
        holeStartAddress.focus()
    }
    resizeMemoryChart(memoryChart, holes)
    // console.group("Hole Added")
    // console.table(holes)
    // console.table(processes)
    // console.groupEnd()

    for (var i = 0; i < holes.length - 1; i++) {
        if (holes[i + 1].start <= holes[i].end) {
            if (holes[i + 1].end > holes[i].end) {
                holes[i].end = holes[i + 1].end
                holes[i].size = holes[i].end - holes[i].start
            }
            holes.splice(i + 1, 1)
            i--
        }
    }
})

function drawHoles(memoryChart, holes, processes, reset) {
    if (reset == 1) {
        holes.sort(function (a, b) {
            return a.start > b.start
        })
        memoryChart.innerHTML = ""
        for (var i = 0; i < holes.length - 1; i++) {
            if (holes[i + 1].start <= holes[i].end) {
                if (holes[i + 1].end > holes[i].end) {
                    holes[i].end = holes[i + 1].end
                    holes[i].size = holes[i].end - holes[i].start
                }
                holes.splice(i + 1, 1)
                i--
            }
        }

        for (var i = 0; i < holes.length; i++) {
            if (i == 0 && holes[i].start != 0)
                memoryChart.innerHTML += createMemoryCellTag(0, holes[i].start, 1, holes[holes.length - 1].end)
            else if (i != 0 && holes[i].start > holes[i - 1].end)
                memoryChart.innerHTML += createMemoryCellTag(holes[i - 1].end, holes[i].start - holes[i - 1].end, 1, holes[holes.length - 1].end)

            memoryChart.innerHTML += createMemoryCellTag(holes[i].start, holes[i].size, 0, holes[holes.length - 1].end, i)
        }
    } else {
        /* IN PROGRESS */
        var newHole = holes[holes.length - 1]
        var memoryCells = memoryChart.getElementsByClassName('memoryCell')
        if (newHole.start > memoryCells[memoryCells.length - 1].getAttribute("data-end")) {
            memoryChart.innerHTML += createMemoryCellTag(parseInt(memoryCells[memoryCells.length - 1].getAttribute("data-end")), - parseInt(memoryCells[memoryCells.length - 1].getAttribute("data-end")) + holes[holes.length - 1].start, 1, holes[holes.length - 1].end)
            memoryChart.innerHTML += createMemoryCellTag(parseInt(memoryCells[memoryCells.length - 1].getAttribute("data-end")), holes[holes.length - 1].size, 0, holes[holes.length - 1].end)
        } else if (newHole.start == memoryCells[memoryCells.length - 1].getAttribute("data-end")) {
            if (memoryCells[memoryCells.length - 1].classList.contains('hasProcess')) {
                memoryChart.innerHTML += createMemoryCellTag(parseInt(memoryCells[memoryCells.length - 1].getAttribute("data-end")), holes[holes.length - 1].size, 0, holes[holes.length - 1].end)
            } else {
                memoryCells[memoryCells.length - 1].setAttribute("data-end", Number(memoryCells[memoryCells.length - 1].getAttribute("data-end")) + newHole.size)
                memoryCells[memoryCells.length - 1].setAttribute("data-size", Number(memoryCells[memoryCells.length - 1].getAttribute("data-size")) + newHole.size)
                holes.splice(length - 1, 1)
            }
        } else {
            holes.splice(length - 1, 1)
            for (var i = 0; i < memoryCells.length; i++) {
                if (Number(memoryCells[i].getAttribute("data-start")) >= newHole.start && Number(memoryCells[i].getAttribute("data-end")) <= (newHole.start + newHole.size)) {
                    if (memoryCells[i].getElementsByClassName('memoryCellProcessId')[0].classList.contains('blank')) {
                        memoryCells[i].getElementsByClassName('memoryCellProcessId')[0].classList.add('available')
                        memoryCells[i].getElementsByClassName('memoryCellProcessId')[0].classList.remove('blank')
                        holes.push(new Hole(Number(memoryCells[i].getAttribute("data-start")), Number(memoryCells[i].getAttribute("data-size"))))
                    }
                }
            }
            if (newHole.start + newHole.size > memoryCells[memoryCells.length - 1].getAttribute("data-end")) {
                var diff = newHole.size - (Number(memoryCells[memoryCells.length - 1].getAttribute("data-end")) - newHole.start)
                if (memoryCells[memoryCells.length - 1].classList.contains('hasProcess')) {
                    memoryChart.innerHTML += createMemoryCellTag(parseInt(memoryCells[memoryCells.length - 1].getAttribute("data-end")), diff, 0, holes[holes.length - 1].end)
                } else {
                    memoryCells[memoryCells.length - 1].setAttribute("data-end", Number(memoryCells[memoryCells.length - 1].getAttribute("data-end")) + diff)
                    memoryCells[memoryCells.length - 1].setAttribute("data-size", Number(memoryCells[memoryCells.length - 1].getAttribute("data-size")) + diff)
                    holes.splice(length - 1, 1)
                }
            }
        }
        resizeMemoryChart(memoryChart)
    }
}

addProcessBtn.addEventListener('click', function (e) {
    e.preventDefault()
    if (pid.value == "" || pSize.value == "" || isNaN(pSize.value)) {
        if (pid.value == "")
            // Add Error CSS Efect to the Input        
            pid.parentNode.classList.add('error')
        else
            // Remove Error CSS Efect out of the Input
            pid.parentNode.classList.remove('error')

        if (pSize.value == "" || isNaN(pSize.value))
            // Add Error CSS Efect to the Input    
            pSize.parentNode.classList.add('error')
        else
            // Remove Error CSS Efect out of the Input
            pSize.parentNode.classList.remove('error')
    } else {
        // Allocate Processes
        var status
        var newProcess = new Process(pid.value, Number(pSize.value))
        if (algorithm.value == "firstFit")
            status = firstFit(holes, memoryChart, newProcess)
        else if (algorithm.value == "bestFit")
            status = bestFit(holes, memoryChart, newProcess)


        if (status) {
            // Remove Error CSS Efect out of the Inputs
            pid.parentNode.classList.remove('error')
            pSize.parentNode.classList.remove('error')

            // Append the Record to the Table
            processTblBody.innerHTML += `
            <tr class="process">
                <td>${pid.value}</td>
                <td>${pSize.value}</td>
                <td><i class="trash icon deleteProcess" id="deleteProcessBtn" data-index="${maxProcessIndex}"></i></td>
            </tr>
        `
            // Append the Record to the Array
            processes.push(newProcess)

            maxProcessIndex++
            // Reset Input Values
            pid.value = ""
            pSize.value = ""
            // Reset Focus to Hole Start Address Input
            pid.focus()
        } else {
            pid.parentNode.classList.add('error')
            pSize.parentNode.classList.add('error')
        }
    }
    resizeMemoryChart(memoryChart)
    // console.group("Process Added")
    // console.table(holes)
    // console.table(processes)
    // console.groupEnd()
})


function Hole(start, size) {
    this.start = start
    this.size = size
    this.end = this.start + this.size
}
function Process(pid, size) {
    this.pid = pid
    this.size = size
    this.start = -1
}
function createMemoryCellTag(address, size, blank, totalSize) {
    var cell = ""
    if (blank) {
        cell = `
        <div class="ui grid padded inverted segment memoryCell" data-start="${address}" data-size="${size}" data-end="${address + size}" style="/*height:calc(${65 * size / totalSize}vh)*/">
            <p class="three wide column ui inverted memoryCellAddress"></p>
            <p class="twelve wide column ui inverted memoryCellProcessId blank"></p>
        </div>`
    } else {
        cell = `
        <div class="ui grid padded inverted segment memoryCell available" data-start="${address}" data-size="${size}" data-end="${address + size}" style="/*height:calc(${65 * size / totalSize}vh)*">
            <p class="three wide column ui inverted memoryCellAddress"></p>
            <p class="twelve wide column ui inverted memoryCellProcessId"></p>
        </div>`
    }
    return cell
}

function resizeMemoryChart(memoryChart) {
    var memoryCells = memoryChart.getElementsByClassName('memoryCell')
    if (memoryCells.length > 0) {
        var totalSize = Number(memoryCells[memoryCells.length - 1].getAttribute('data-end'))
        var totalHeight = 0.8 * (Number(document.getElementsByTagName('body')[0].clientHeight) - Number(memoryChart.offsetTop)) - 30
        memoryChart.style.height = totalHeight + "px"
        for (var i = 0; i < memoryCells.length; i++)
            memoryCells[i].style.height = Number(memoryCells[i].getAttribute('data-size')) / totalSize * 100 + "%"
    }
}
function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}
function insertBefore(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode);
}
function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
}

function allocateAndDraw(holes, memoryChart, newProcess, memoryCell, i, isAllocated = false) {
    newProcess.start = Number(memoryCell.getAttribute("data-start"))
    if (holes[i].size > newProcess.size) {
        if (!isAllocated) {
            holes[i].start += newProcess.size
            holes[i].size -= newProcess.size
        }
        const originalSize = Number(memoryCell.getAttribute("data-size"))
        // memoryCell.style.height /= 5
        console.table(insertedHoles)

        const newHole = memoryCell.cloneNode(true)
        memoryCell.setAttribute("data-size", newProcess.size)
        memoryCell.setAttribute("data-end", newProcess.size + Number(memoryCell.getAttribute("data-start")))
        memoryCell.setAttribute("data-index", maxProcessIndex)

        newHole.setAttribute("data-start", Number(memoryCell.getAttribute("data-end")))
        newHole.setAttribute("data-size", originalSize - newProcess.size)
        insertAfter(newHole, memoryCell)
        // insertBefore(newHole,memoryCell)

        memoryCell.getElementsByClassName('memoryCellProcessId')[0].innerHTML = newProcess.pid

        memoryCell.classList.remove('available')
        memoryCell.classList.add('hasProcess')

        return 1

    } else if (holes[i].size == newProcess.size) {
        holes.splice(i, 1)
        const pidContainer = memoryCell.getElementsByClassName('memoryCellProcessId')[0]
        memoryCell.classList.remove('available')
        memoryCell.classList.add('hasProcess')
        memoryCell.setAttribute("data-index", maxProcessIndex)
        pidContainer.innerHTML = newProcess.pid
        return 1
    }

}

function firstFit(holes, memoryChart, newProcess,isAllocated = false) {
    var foundSpace = false
    for (var i = 0; i < holes.length; i++) {
        if (holes[i].size >= newProcess.size) {
            const memoryCell = memoryChart.getElementsByClassName('available')[i]
            foundSpace = true
            if (allocateAndDraw(holes, memoryChart, newProcess, memoryCell, i,isAllocated) == 1)
                break
        }
    }
    if (!foundSpace) {
        new Notification('Memory Manager', {
            body: 'Sorry !, There\'s not enough space to Allocate this Process\nDe-Allocate Some Processes & Try again.',
            icon: __dirname + '/assets/images/sign-error-icon.png'

        })
    }
    return foundSpace
}
function bestFit(holes, memoryChart, newProcess, isAllocated = false) {
    var foundSpace = false
    var memoryCell = memoryChart.getElementsByClassName('available')[0]
    var bestFitCellIndex = 0

    for (var i = 0; i < holes.length; i++) {
        if (holes[i].size <= Number(memoryCell.getAttribute('data-size')) && holes[i].size >= newProcess.size) {
            memoryCell = memoryChart.getElementsByClassName('available')[i]
            bestFitCellIndex = i
            foundSpace = true
        }
    }
    if (!foundSpace) {
        new Notification('Memory Manager', {
            body: 'Sorry, There\'s not enough space \nDeAllocate Some Processes'
        })
    } else {
        allocateAndDraw(holes, memoryChart, newProcess, memoryCell, bestFitCellIndex, isAllocated)
    }
    return foundSpace
}