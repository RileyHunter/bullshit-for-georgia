const gravity = 2; // screens/s/s

class Game {
    constructor() {
        this.entities = [];
        this.lastRenderTime = Date.now();
        this.timeDelta = null;
        this.spawnId = 0;
        this.mouseX = null;
        this.mouseY = null;
    }

    spawn(T, ...args) {
        let newEnt = new T(...args);
        this.entities.push(newEnt);
        return newEnt;
    }

    render(context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        this.entities.sort((a, b) => a.z - b.z).forEach(e => e.render(context));
        let currentTime = Date.now();
        this.timeDelta = currentTime - this.lastRenderTime;
        this.lastRenderTime = currentTime;
    }

    update() {
        this.entities.forEach(e => e.update && e.update(this));
    }

    receiveMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
}

class Entity {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
    }

    static async cacheSprite() {
        if (!(this.spritePath)) {
            throw new Error(`Entity ${this.name} does not have a static spritePath`);
        } else {
            console.log(`Caching sprite for ${this.name}`);
        }
        this.prototype.sprite = await fetch(this.spritePath)
            .then(data => data.blob())
            .then(blob => createImageBitmap(blob));
        console.log(`Sprite for ${this.name} loaded`);
    }

    render(context) {
        if (this.active) {
            let x = this.x * context.canvas.width - (this.sprite.width / 2);
            let y = this.y * context.canvas.height - (this.sprite.height / 2);
            context.drawImage(this.sprite, x, y);
        }
    }
}

class Pipe extends Entity {
    static spritePath = 'https://i.imgur.com/OtysgCb.png';
    constructor(x, y) {
        super(x, y, 3);
        this.canCollide = true;
    }

    update(game) {
        if (!this.active) {
            return;
        } else if (this.canCollide && this.y >= .9 && this.x >= .3 && this.x <= .7) {
            this.canCollide = false;
            this.vy = -.5;
            var audio = new Audio('https://us-tuna-sounds-files.voicemod.net/ade71f0d-a41b-4e3a-8097-9f1cc585745c-1646035604239.mp3');
            audio.play();
        } else if (this.y > 2) {
            this.active = false;
        } else {
            this.y += this.vy * game.timeDelta / 1000;
            this.vy += gravity * game.timeDelta / 1000;
        }
    }
}

class Rat extends Entity {
    static spritePath = 'https://i.imgur.com/XvrXeA3.png';
    constructor(x, y) {
        super(x, y, 0);
    }

    update(game) {
        this.x = game.mouseX;
    }
}

class Floor extends Entity {
    static spritePath = 'https://i.imgur.com/v6haglM.png';
    constructor() {
        super(.5, .9, 0);
    }
}

async function main(container) {
    const game = new Game();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const rat = game.spawn(Rat, .5, .1);
    const floor = game.spawn(Floor);

    container.innerHTML = '';
    let onResizeHandler = () => {
        canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    }
    
    onResizeHandler();
    container.onresize = onResizeHandler;

    let onClickHandler = () => {
        game.spawn(Pipe, rat.x, rat.y);
    }
    container.onclick = onClickHandler;

    container.onmousemove = e => game.receiveMousePosition(e.clientX / canvas.width, e.clientY / canvas.height);

    function mainLoop() {
        game.render(context);
        game.update();
        setTimeout(mainLoop, 10);
    }

    container.appendChild(canvas);
    const allTypes = [Pipe, Rat, Floor];
    Promise.all(allTypes.map(T => T.cacheSprite())).then(mainLoop);
}

main(document.body);