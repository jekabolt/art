var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Adjust for mobile performance
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Smaller cloth for mobile
var width = 8;
var height = 8;
var nodeCount = width * height;

var dt = 1 / 60;
var gravity = 9.8;
var iterations = 10; // fewer constraint iterations
var wind_strength = 15; // lower wind strength
var speed = 0.2; // slower wind changes
var stiffness = 0.9; // slightly less stiff to ease CPU

var img = new Image();
// Use a smaller image if possible
img.src = "https://files.grbpwr.com/new-texture-300.png";

var nodes = [];
var nodes_uv = [];
var links = [];
var wind = [];

var delta = Math.min((canvas.width / 2) / (width * 1.5), (canvas.height / 2) / (height * 1.5));
var dx = delta;
var dy = delta;
var max_dist = delta * stiffness;

// Create nodes
for (var i = 0; i < nodeCount; i++) {
    var xIndex = i % width;
    var yIndex = Math.floor(i / width);
    var xPos = canvas.width / 2 - (width / 2) * dx + xIndex * dx;
    var yPos = canvas.height / 2 - (height / 2) * dy + yIndex * dy;

    nodes.push({
        x: xPos,
        y: yPos,
        last_x: xPos,
        last_y: yPos,
        static: false
    });

    var u = xIndex / (width - 1);
    var v = yIndex / (height - 1);
    nodes_uv.push({ u: u, v: v });
}

// Pin the left side
for (var yy = 0; yy < height; yy++) {
    nodes[yy * width].static = true;
}

// Create links
for (i = 0; i < nodeCount - 1; i++) {
    if (((i + 1) % width) > 0) {
        links.push({ first: i, second: i + 1 });
    }
}
for (i = 0; i < nodeCount - width; i++) {
    links.push({ first: i, second: i + width });
}

var mean = 0;
var mean_2 = -width;

function updateWind() {
    mean += speed;
    if (mean > width * 1.5) mean = -0.5 * width;

    mean_2 += speed;
    if (mean_2 > width * 1.5) mean_2 = -0.5 * width;

    for (i = 0; i < nodeCount; i++) {
        // Wind always positive (left to right)
        var baseWind = (0.5 + Math.random() * 0.5) * wind_strength;
        wind[i] = baseWind;
    }
}

function dist(x, y) { return Math.sqrt(x * x + y * y); }

function resolve_constraints() {
    for (var iter = 0; iter < iterations; iter++) {
        for (var li = 0; li < links.length; li++) {
            var first = nodes[links[li].first];
            var second = nodes[links[li].second];
            var dx_ = first.x - second.x;
            var dy_ = first.y - second.y;
            var d = Math.sqrt(dx_ * dx_ + dy_ * dy_);
            if (d > max_dist) {
                var diff = (max_dist - d) / d;
                var tx = dx_ * 0.5 * diff;
                var ty = dy_ * 0.5 * diff;

                if (!first.static && links[li].first != active_node) {
                    first.x += tx;
                    first.y += ty;
                }
                if (!second.static && links[li].second != active_node) {
                    second.x -= tx;
                    second.y -= ty;
                }
            }
        }
    }
}

function moveCloth() {
    updateWind();
    for (i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (!n.static && i != active_node) {
            var accX = wind[i];
            var accY = gravity;
            var x_vel = n.x - n.last_x + accX * dt;
            var y_vel = n.y - n.last_y + accY * dt;
            var next_x = n.x + x_vel;
            var next_y = n.y + y_vel;

            n.last_x = n.x;
            n.last_y = n.y;
            n.x = next_x;
            n.y = next_y;

            if (n.x < 10) n.x = 10;
            if (n.y < 10) n.y = 10;
            if (n.x > canvas.width - 10) n.x = canvas.width - 10;
            if (n.y > canvas.height - 10) n.y = canvas.height - 10;
        }
    }
}

// Touch interaction for mobile
var active_node = -1;
var drag = false;

function getTouchPos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
    };
}

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    drag = true;
    var pos = getTouchPos(e);
    var mouse_pos_x = pos.x;
    var mouse_pos_y = pos.y;
    active_node = -1;
    for (var l = 0; l < nodes.length; l++) {
        if (dist(mouse_pos_x - nodes[l].x, mouse_pos_y - nodes[l].y) < 20) {
            active_node = l;
            nodes[active_node].x = mouse_pos_x;
            nodes[active_node].y = mouse_pos_y;
            nodes[active_node].last_x = mouse_pos_x;
            nodes[active_node].last_y = mouse_pos_y;
            break;
        }
    }
});

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (drag && active_node != -1) {
        var pos = getTouchPos(e);
        nodes[active_node].x = pos.x;
        nodes[active_node].y = pos.y;
        nodes[active_node].last_x = pos.x;
        nodes[active_node].last_y = pos.y;
    }
});

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    drag = false;
    active_node = -1;
});

function drawTriangleWarp(ctx, image,
    sx0, sy0, sx1, sy1, sx2, sy2,
    dx0, dy0, dx1, dy1, dx2, dy2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dx0, dy0);
    ctx.lineTo(dx1, dy1);
    ctx.lineTo(dx2, dy2);
    ctx.closePath();
    ctx.clip();

    var denom = (sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1));
    if (denom === 0) { ctx.restore(); return; }

    var a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
    var b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
    var c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
    var d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;
    var e = (dx0 * (sx1 * sy2 - sx2 * sy1) + dx1 * (sx2 * sy0 - sx0 * sy2) + dx2 * (sx0 * sy1 - sx1 * sy0)) / denom;
    var f = (dy0 * (sx1 * sy2 - sx2 * sy1) + dy1 * (sx2 * sy0 - sx0 * sy2) + dy2 * (sx0 * sy1 - sx1 * sy0)) / denom;

    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
}

function drawCloth() {
    if (!img.complete || img.width === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var y = 0; y < height - 1; y++) {
        for (var x = 0; x < width - 1; x++) {
            var i0 = y * width + x;
            var i1 = y * width + x + 1;
            var i2 = (y + 1) * width + x;
            var i3 = (y + 1) * width + x + 1;

            var n0 = nodes[i0],
                n1 = nodes[i1],
                n2 = nodes[i2],
                n3 = nodes[i3];
            var uv0 = nodes_uv[i0],
                uv1 = nodes_uv[i1],
                uv2 = nodes_uv[i2],
                uv3 = nodes_uv[i3];

            var sx0 = uv0.u * img.width,
                sy0 = uv0.v * img.height;
            var sx1 = uv1.u * img.width,
                sy1 = uv1.v * img.height;
            var sx2 = uv2.u * img.width,
                sy2 = uv2.v * img.height;
            var sx3 = uv3.u * img.width,
                sy3 = uv3.v * img.height;

            drawTriangleWarp(ctx, img,
                sx0, sy0, sx1, sy1, sx2, sy2,
                n0.x, n0.y, n1.x, n1.y, n2.x, n2.y);
            drawTriangleWarp(ctx, img,
                sx2, sy2, sx1, sy1, sx3, sy3,
                n2.x, n2.y, n1.x, n1.y, n3.x, n3.y);
        }
    }
}

function animate() {
    resolve_constraints();
    moveCloth();
    drawCloth();
    requestAnimationFrame(animate);
}

animate();