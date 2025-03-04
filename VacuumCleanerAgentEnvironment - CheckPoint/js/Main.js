class Action {
    static noOp = 0;
    static moveRight = 1;
    static moveLeft = 2;
    static moveUp = 3;
    static moveDown = 4;
    static suck = 5;
}

class VcBackend {
    constructor() {
        this.m = 0;
        this.n = 0;
        this.envTable = [];
        this.agentPos = [];
        this.percept = [];
        this.action = Action.noOp;
        this.isFinished = false;
        this.checkedCellNo = 0;
        this.dirtNo = 0;
        this.suckNo = 0;
        this.actionNo = 0;
    }

    _initiateEnv() {
        for (let i = 0; i < this.m; i++) {
            this.envTable[i] = [];
            for (let j = 0; j < this.n; j++) {
                let rand = Math.floor(Math.random() * 2);
                this.envTable[i][j] = rand;
                if (rand === 1) this.dirtNo++;
            }
        }
    }

    reset() {
        this.envTable = [];
        this.agentPos = [0, 0];
        this.isFinished = false;
        this.checkedCellNo = 1;
        this.dirtNo = 0;
        this.suckNo = 0;
        this.actionNo = 0;
        this._initiateEnv();
        this.percept = [0, 0, this.envTable[0][0]];
        this.action = Action.noOp;
    }

    env(action) {
        let row = this.agentPos[0];
        let col = this.agentPos[1];
        let percept = [];
        let status;

        if (action === Action.moveRight) {
            this.agentPos = [row, ++col];
        } else if (action === Action.moveLeft) {
            this.agentPos = [row, --col];
        } else if (action === Action.moveUp) {
            this.agentPos = [--row, col];
        } else if (action === Action.moveDown) {
            this.agentPos = [++row, col];
        } else if (action === Action.suck) {
            this.envTable[row][col] = 0;
        }

        status = this.envTable[row][col];
        percept = [row, col, status];
        return percept;
    }

    agent(percept) {
        let row = percept[0];
        let col = percept[1];
        let status = percept[2];
        let action = Action.noOp;

        if (status === 1) {
            action = Action.suck;
            this.suckNo++;
            this.actionNo++;
        } else if (this.checkedCellNo === this.m * this.n) {
            action = Action.noOp;
        } else if ((col === this.n - 1 && row % 2 === 0) || (col === 0 && row % 2 === 1)) {
            action = Action.moveDown;
            this.actionNo++;
            this.checkedCellNo++;
        } else if (row % 2 === 0) {
            action = Action.moveRight;
            this.actionNo++;
            this.checkedCellNo++;
        } else if (row % 2 === 1) {
            action = Action.moveLeft;
            this.actionNo++;
            this.checkedCellNo++;
        }

        return action;
    }

    nextStep() {
        this.action = this.agent(this.percept);
        this.percept = this.env(this.action);

        if (this.action === Action.noOp) {
            this.isFinished = true;
        }
    }
}

class VcFrontend {
    constructor() {
        this.mInput = document.getElementById('m-num');
        this.nInput = document.getElementById('n-num');
        this.delay = document.getElementById('delay-num');
        this.startBtn = document.getElementById('start-btn');
        this.container = document.getElementById('table-wrapper');
        this.dirtNo = document.getElementById('dirt-no');
        this.checkedNo = document.getElementById('checked-no');
        this.suckNo = document.getElementById('suck-no');
        this.actionNo = document.getElementById('action-no');
        this.vcb = new VcBackend();
        this.agent;
        this.table;
        this.mInput.value = 5;
        this.nInput.value = 5;
        this.delay.value = 270;
        this.nextInterval;
        this.initiateListeners();
    }

    initiateListeners() {
        this.startBtn.onclick = () => {
            this.vcb.m = parseInt(this.mInput.value);
            this.vcb.n = parseInt(this.nInput.value);
            this.vcb.reset();
            this.createTable();
            this.dirtNo.innerText = `Number of Trash: ${this.vcb.dirtNo}`;
            if (this.nextInterval) {
                clearInterval(this.nextInterval);
            }
            this.nextInterval = setInterval(() => {
                this.vcb.nextStep();
                this.checkedNo.innerText = `Perceived Cells: ${this.vcb.checkedCellNo}`;
                this.suckNo.innerText = `Number of Cells Cleaned: ${this.vcb.suckNo}`;
                this.actionNo.innerText = `Number of Agent Actions: ${this.vcb.actionNo}`;
                let cell = document.querySelector(`#row-${this.vcb.agentPos[0]}-col-${this.vcb.agentPos[1]}`);
                if (this.vcb.action === Action.suck) {
                    let dirt = cell.querySelector('.dirt');
                    if (dirt) {
                        dirt.remove();  // Remove the dirt icon
                        cell.style.backgroundColor = 'lightgreen';  // Change the background color to light green
                    }
                } else {
                    cell.appendChild(this.agent);
                    this.agent.scrollIntoView({ block: "center", inline: "center" });
                }
                if (this.nextInterval && this.vcb.isFinished) {
                    clearInterval(this.nextInterval);
                }
            }, this.delay.value);
        };
    }

    createTable() {
        if (this.table) {
            this.agent.remove();
            this.table.remove();
        }
        this.table = document.createElement('table');
        this.agent = document.createElement('span');
        this.agent.className = 'agent';
        this.agent.innerHTML = '<i class="fas fa-snowplow"></i>';
        for (let i = 0; i < this.vcb.m; i++) {
            let tr = document.createElement('tr');
            tr.id = `tr-${i}`;
            for (let j = 0; j < this.vcb.n; j++) {
                let td = document.createElement('td');
                let number = document.createElement('span');
                if (this.vcb.envTable[i][j] === 1) td.innerHTML = '<span class="dirt"><i class="far fa-trash-alt"></i></span>';
                td.id = `row-${i}-col-${j}`;
                number.className = 'cell-number';
                number.innerText = `${i},${j}`;
                td.appendChild(number);
                tr.appendChild(td);
            }
            this.table.appendChild(tr);
        }
        this.container.appendChild(this.table);
        document.querySelector(`#row-${this.vcb.agentPos[0]}-col-${this.vcb.agentPos[1]}`).appendChild(this.agent);
    }
}

$(document).ready(function () {
    let vcf = new VcFrontend();
});
