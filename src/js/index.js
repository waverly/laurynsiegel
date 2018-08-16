// dependencies
var Prismic = require("prismic-javascript");
var PrismicDOM = require("prismic-dom");
// var Noise = require("noisejs");
// import * as Noise from "noisejs";
var THREE = require("three");
var OrbitControls = require("three-orbit-controls")(THREE);
const dat = require("dat.gui");

var apiEndpoint = "https://laurynsiegel.prismic.io/api/v2";

var linkResolver = function(doc) {
  return null;
};

let results;
let header;
let expandabletext;
let social;
let expTextHtml;

Prismic.api(apiEndpoint)
  .then(function(api) {
    return api.query(""); // An empty query will return all the documents
  })
  .then(
    function(response) {
      // console.log("Documents: ", response.results);

      results = response.results;
      header = results[0].data.header[0].text;
      let { expandabletext, social } = results[0].data;

      expTextHtml = PrismicDOM.RichText.asHtml(expandabletext, linkResolver);

      // replace innerHTML in header and expandableText
      document.getElementById("header").innerHTML = header;
      document.getElementById("expandedText").innerHTML = expTextHtml;

      // loop through social links and add all to span

      // when span contians the same # of child nodes as lenght of socials, clone span nodes

      // append both to .marquee-inner

      const marqueeLinkWrap = document.createElement("div");
      marqueeLinkWrap.classList.add("marquee-link-wrap");

      const makeClone = toClone => toClone.cloneNode(true);

      const createMarqueeItem = s => {
        const divWrapper = document.createElement("div");
        divWrapper.classList.add("marquee__item");
        const link = s.link.url;
        const title = s.title[0].text;
        const a = document.createElement("a");
        const h1 = document.createElement("h1");
        const dashSpan = document.createElement("span");
        dashSpan.classList.add("marquee__dash");

        h1.innerHTML = `${title}`;
        a.setAttribute("href", link);
        a.setAttribute("target", "_blank");
        a.appendChild(h1);
        divWrapper.appendChild(a);
        divWrapper.appendChild(dashSpan);
        return divWrapper;
      };

      social.map((s, index, array) => {
        marqueeLinkWrap.appendChild(createMarqueeItem(s));
        if (marqueeLinkWrap.childElementCount === social.length) {
          const marqueeParent = document.querySelector(".marquee-inner");
          console.log("below should be the clone");
          console.log(makeClone(marqueeLinkWrap));
          marqueeParent.appendChild(makeClone(marqueeLinkWrap));
          marqueeParent.appendChild(makeClone(marqueeLinkWrap));
        }
      });

      document.querySelector(".text-wrap").classList.add("loaded");
    },
    function(err) {
      console.log("Something went wrong: ", err);
    }
  );

const collapseSection = element => {
  const sectionHeight = element.scrollHeight;

  const elementTransition = element.style.transition;
  element.style.transition = "";

  requestAnimationFrame(function() {
    element.style.height = sectionHeight + "px";
    element.style.transition = elementTransition;

    // on the next frame (as soon as the previous style change has taken effect),
    // have the element transition to height: 0
    requestAnimationFrame(function() {
      element.style.height = `0px`;
    });
  });

  // mark the section as "currently collapsed"
  element.setAttribute("data-collapsed", "true");
};

function expandSection(element) {
  const sectionHeight = element.scrollHeight;

  element.style.height = `${sectionHeight}px`;

  // when the next css transition finishes (which should be the one we just triggered)
  element.addEventListener("transitionend", e => {
    // remove this event listener so it only gets triggered once
    element.removeEventListener("transitionend", arguments.callee);

    // remove "height" from the element's inline styles, so it can return to its initial value
    // element.style.height = null;
  });

  // mark the section as "currently not collapsed"
  element.setAttribute("data-collapsed", "false");
}

// STLL LOADER

THREE.STLLoader = function(manager) {
  this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
};
THREE.STLLoader.prototype = {
  constructor: THREE.STLLoader,
  load: function(url, onLoad, onProgress, onError) {
    var scope = this;
    var loader = new THREE.FileLoader(scope.manager);
    loader.setResponseType("arraybuffer");
    loader.load(
      url,
      function(text) {
        try {
          onLoad(scope.parse(text));
        } catch (exception) {
          if (onError) {
            onError(exception);
          }
        }
      },
      onProgress,
      onError
    );
  },
  parse: function(data) {
    function isBinary(data) {
      var expect, face_size, n_faces, reader;
      reader = new DataView(data);
      face_size = 32 / 8 * 3 + 32 / 8 * 3 * 3 + 16 / 8;
      n_faces = reader.getUint32(80, !0);
      expect = 80 + 32 / 8 + n_faces * face_size;
      if (expect === reader.byteLength) {
        return !0;
      }
      var solid = [115, 111, 108, 105, 100];
      for (var i = 0; i < 5; i++) {
        if (solid[i] != reader.getUint8(i, !1)) return !0;
      }
      return !1;
    }
    function parseBinary(data) {
      var reader = new DataView(data);
      var faces = reader.getUint32(80, !0);
      var r,
        g,
        b,
        hasColors = !1,
        colors;
      var defaultR, defaultG, defaultB, alpha;
      for (var index = 0; index < 80 - 10; index++) {
        if (
          reader.getUint32(index, !1) == 0x434f4c4f &&
          reader.getUint8(index + 4) == 0x52 &&
          reader.getUint8(index + 5) == 0x3d
        ) {
          hasColors = !0;
          colors = [];
          defaultR = reader.getUint8(index + 6) / 255;
          defaultG = reader.getUint8(index + 7) / 255;
          defaultB = reader.getUint8(index + 8) / 255;
          alpha = reader.getUint8(index + 9) / 255;
        }
      }
      var dataOffset = 84;
      var faceLength = 12 * 4 + 2;
      var geometry = new THREE.BufferGeometry();
      var vertices = [];
      var normals = [];
      for (var face = 0; face < faces; face++) {
        var start = dataOffset + face * faceLength;
        var normalX = reader.getFloat32(start, !0);
        var normalY = reader.getFloat32(start + 4, !0);
        var normalZ = reader.getFloat32(start + 8, !0);
        if (hasColors) {
          var packedColor = reader.getUint16(start + 48, !0);
          if ((packedColor & 0x8000) === 0) {
            r = (packedColor & 0x1f) / 31;
            g = ((packedColor >> 5) & 0x1f) / 31;
            b = ((packedColor >> 10) & 0x1f) / 31;
          } else {
            r = defaultR;
            g = defaultG;
            b = defaultB;
          }
        }
        for (var i = 1; i <= 3; i++) {
          var vertexstart = start + i * 12;
          vertices.push(reader.getFloat32(vertexstart, !0));
          vertices.push(reader.getFloat32(vertexstart + 4, !0));
          vertices.push(reader.getFloat32(vertexstart + 8, !0));
          normals.push(normalX, normalY, normalZ);
          if (hasColors) {
            colors.push(r, g, b);
          }
        }
      }
      geometry.addAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(vertices), 3)
      );
      geometry.addAttribute(
        "normal",
        new THREE.BufferAttribute(new Float32Array(normals), 3)
      );
      if (hasColors) {
        geometry.addAttribute(
          "color",
          new THREE.BufferAttribute(new Float32Array(colors), 3)
        );
        geometry.hasColors = !0;
        geometry.alpha = alpha;
      }
      return geometry;
    }
    function parseASCII(data) {
      var geometry = new THREE.BufferGeometry();
      var patternFace = /facet([\s\S]*?)endfacet/g;
      var faceCounter = 0;
      var patternFloat = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/
        .source;
      var patternVertex = new RegExp(
        "vertex" + patternFloat + patternFloat + patternFloat,
        "g"
      );
      var patternNormal = new RegExp(
        "normal" + patternFloat + patternFloat + patternFloat,
        "g"
      );
      var vertices = [];
      var normals = [];
      var normal = new THREE.Vector3();
      var result;
      while ((result = patternFace.exec(data)) !== null) {
        var vertexCountPerFace = 0;
        var normalCountPerFace = 0;
        var text = result[0];
        while ((result = patternNormal.exec(text)) !== null) {
          normal.x = parseFloat(result[1]);
          normal.y = parseFloat(result[2]);
          normal.z = parseFloat(result[3]);
          normalCountPerFace++;
        }
        while ((result = patternVertex.exec(text)) !== null) {
          vertices.push(
            parseFloat(result[1]),
            parseFloat(result[2]),
            parseFloat(result[3])
          );
          normals.push(normal.x, normal.y, normal.z);
          vertexCountPerFace++;
        }
        if (normalCountPerFace !== 1) {
          console.error(
            "THREE.STLLoader: Something isn't right with the normal of face number " +
              faceCounter
          );
        }
        if (vertexCountPerFace !== 3) {
          console.error(
            "THREE.STLLoader: Something isn't right with the vertices of face number " +
              faceCounter
          );
        }
        faceCounter++;
      }
      geometry.addAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      geometry.addAttribute(
        "normal",
        new THREE.Float32BufferAttribute(normals, 3)
      );
      return geometry;
    }
    function ensureString(buffer) {
      if (typeof buffer !== "string") {
        return THREE.LoaderUtils.decodeText(new Uint8Array(buffer));
      }
      return buffer;
    }
    function ensureBinary(buffer) {
      if (typeof buffer === "string") {
        var array_buffer = new Uint8Array(buffer.length);
        for (var i = 0; i < buffer.length; i++) {
          array_buffer[i] = buffer.charCodeAt(i) & 0xff;
        }
        return array_buffer.buffer || array_buffer;
      } else {
        return buffer;
      }
    }
    var binData = ensureBinary(data);
    return isBinary(binData)
      ? parseBinary(binData)
      : parseASCII(ensureString(data));
  }
};

// END STLL LOADER

window.onload = e => {
  const readMore = document.querySelector("#read-more");
  const section = document.querySelector(".expanded-text");
  const wrapper = document.querySelector(".container");

  readMore.addEventListener("click", () => {
    const isCollapsed = section.getAttribute("data-collapsed") === "true";

    if (isCollapsed) {
      expandSection(section);
      section.setAttribute("data-collapsed", "false");
    } else {
      collapseSection(section);
    }
  });
  //  end readMore section

  // start threeJS
  var canvas = document.getElementById("canvas");

  var TWO_PI = Math.PI * 2;
  const mobile =
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    //|| navigator.userAgent.match(/iPad/i)
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i);

  //Spatial variables
  var width = 2000;
  var height = 2000;
  var depth = 2000;
  var centre = [width / 2, height / 2, depth / 2];

  var flakes = [];

  var flakeCount;

  if (mobile) {
    flakeCountx = 2000;
  } else {
    flakeCount = 2500;
  }

  //Speed of falling
  var fall = 2;
  //Rotation of flakes
  var swirl = 1;
  //Noise field zoom
  var step = 100;
  //Camera rotate
  var rotate = true;

  //Initialise three.js
  var scene = new THREE.Scene();

  // var camera = new THREE.PerspectiveCamera(
  //   75,
  //   window.innerWidth / window.innerHeight,
  //   0.1,
  //   1000
  // );

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // sets background color
  renderer.setClearColor(0x111111, 0.8);
  document.querySelector(".container").appendChild(renderer.domElement);

  var distance = 400;

  var FOV = 2 * Math.atan(window.innerHeight / (2 * distance)) * 40 / Math.PI;

  var camera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );

  camera.up.set(0, 0, 1);
  // camera.position.set(width / 2, -height / 2, 500);
  camera.position.set(width / 2, -height / 0.5, 500);
  camera.lookAt(new THREE.Vector3(centre[0], centre[1], centre[2]));
  // camera.position.z = 5;
  // camera.position.x = 10;
  // camera.position.z = 100;

  scene.add(camera);
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // GOING TO SKIP ORBIT CONTROLS FOR NOW
  //OrbitControls.js for camera manipulation
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxDistance = 2 * width;
  controls.minDistance = width / 2;
  controls.autoRotate = rotate;

  //Lights
  var light_1;
  light_1 = new THREE.HemisphereLight(0x114417, 0xffffff, 0.3);
  light_1.position.set(0, 0, -depth);
  light_1.lookAt(0, 0, -1);
  scene.add(light_1);

  var light_2;
  light_2 = new THREE.DirectionalLight(0xff0000, 1.0);
  light_2.position.set(-1, 1, 1);
  scene.add(light_2);
  var light_3;
  light_3 = new THREE.DirectionalLight(0x00ff00, 1.0);
  light_3.position.set(-1, -1, 1);
  scene.add(light_3);
  var light_4;
  light_4 = new THREE.DirectionalLight(0x3333ff, 1.0);
  light_4.position.set(1, -1, 1);
  scene.add(light_4);

  //Material for dancer and base
  var material_d = new THREE.MeshLambertMaterial({ color: 0xffffff });
  var loader = new THREE.STLLoader();
  //Load dancer
  loader.load(
    // "https://res.cloudinary.com/al-ro/raw/upload/v1531776249/ballerina_1_mu2pmx.stl",
    "https://res.cloudinary.com/dzlun7snb/raw/upload/v1534374363/TRY_THIS_AUG_12.stl",
    function(geometry) {
      var mesh = new THREE.Mesh(geometry, material_d);

      // mesh.scale.set(depth / 22, depth / 22, depth / 22);
      // mesh.position.set(-20, -30, -depth / 3 + 75);

      mesh.scale.set(depth / 28, depth / 28, depth / 28);
      mesh.position.set(-450, -50, -depth / 5 + 475);

      // mesh.lookAt(1, 2, 1);

      // mesh.rotation.x = -40 * Math.PI / 180;
      // mesh.rotation.y = -20 * Math.PI / 180;

      // mesh.rotateX(-70 * Math.PI / 180);
      // mesh.rotateY(-20 * Math.PI / 180);
      // mesh.rotateZ(30 * Math.PI / 180);

      scene.add(mesh);
    }
  );

  //Load base
  // loader.load(
  //   "https://res.cloudinary.com/al-ro/raw/upload/v1531777915/base_uluxjn.stl",
  //   function(geometry) {
  //     var mesh = new THREE.Mesh(geometry, material_d);
  //
  //     mesh.scale.set(depth / 2, depth / 2, depth / 2);
  //     mesh.position.set(-725, -725, -1050);
  //
  //     scene.add(mesh);
  //   }
  // );

  //Define hexagon shape for flakes
  var geom = new THREE.Geometry();

  //Brackets for purely aesthetic considerations
  {
    geom.vertices.push(
      new THREE.Vector3(-0.5, 0.86, 0),
      new THREE.Vector3(0.5, 0.86, 0),
      new THREE.Vector3(0.93, 0.0, 0),
      new THREE.Vector3(0.5, -0.86, 0),
      new THREE.Vector3(-0.5, -0.86, 0),
      new THREE.Vector3(-0.93, 0.0, 0)
    );
  }

  geom.faces.push(new THREE.Face3(0, 1, 2));
  geom.faces.push(new THREE.Face3(0, 2, 3));
  geom.faces.push(new THREE.Face3(0, 3, 4));
  geom.faces.push(new THREE.Face3(0, 4, 5));

  geom.scale(7, 7, 7);

  var colour = 0x939393;

  var material = new THREE.MeshPhongMaterial({
    color: colour,
    specular: 0xffffff,
    side: THREE.DoubleSide,
    shading: THREE.FlatShading
  });

  //Generate random flakes
  for (var i = 0; i < flakeCount; i++) {
    var g_ = new THREE.Mesh(geom, material);

    var x = 0.5 - Math.random();
    var y = 0.5 - Math.random();
    var z = 0.5 - Math.random();

    var flake = {
      vel_x: x,
      vel_y: y,
      vel_z: z,
      geo: g_
    };

    flake.geo.position.x = width / 2 - Math.random() * width;
    flake.geo.position.y = height / 2 - Math.random() * height;
    flake.geo.position.z = depth / 2 - Math.random() * depth;

    flake.geo.rotation.x = 2 * (Math.random() - 1.0);
    flake.geo.rotation.y = 2 * (Math.random() - 1.0);
    flake.geo.rotation.z = 2 * (Math.random() - 1.0);

    flakes.push(flake);
  }

  for (i = 0; i < flakes.length; i++) {
    scene.add(flakes[i].geo);
  }

  //-----------GUI-----------//
  //dat.gui library controls

  // getting error "object, object has no property FALL"

  // var gui = new dat.GUI();
  //
  // gui
  //   .add(this, "fall")
  //   .min(0)
  //   .max(10)
  //   .step(1)
  //   .listen();
  //   gui
  //     .add(this, "swirl")
  //     .min(0)
  //     .max(10)
  //     .step(1)
  //     .listen();
  // if (!mobile) {
  //   gui
  //     .addColor(this, "colour")
  //     .listen()
  //     .onChange(function(value) {
  //       setColour();
  //     });
  // }
  // gui
  //   .add(this, "rotate")
  //   .listen()
  //   .onChange(function(value) {
  //     controls.autoRotate = rotate;
  //   });
  // gui.close();
  //
  // function setColour() {
  //   material.color.setHex(colour);
  // }

  //USed for flake position
  var A = {
    x: 0,
    y: 0,
    z: 0
  };

  //Vector pointing up
  var B = {
    x: 0,
    y: 0,
    z: 1
  };

  //Vector tangent to A and B to define movement around B
  var n = {
    x: 0,
    y: 0,
    z: 0
  };

  //cross product
  function cross(A, B, n) {
    n.x = A.y * B.z - B.y * A.z;
    n.y = A.z * B.x - B.z * A.x;
    n.z = A.x * B.y - B.x * A.y;
  }

  //----------NOISE---------//

  var noise_ = [];

  // var noise = new Noise(Math.random());

  //Use noise.js library to generate a grid of 3D simplex noise values
  try {
    noise.seed(Math.random());
  } catch (err) {
    console.log(err.message);
  }

  //Find the curl of the noise field based on on the noise value at the location of a flake
  function computeCurl(x, y, z) {
    var eps = 0.0001;

    var curl = new THREE.Vector3();

    //Find rate of change in YZ plane
    var n1 = noise.simplex3(x, y + eps, z);
    var n2 = noise.simplex3(x, y - eps, z);
    //Average to find approximate derivative
    var a = (n1 - n2) / (2 * eps);
    var n1 = noise.simplex3(x, y, z + eps);
    var n2 = noise.simplex3(x, y, z - eps);
    //Average to find approximate derivative
    var b = (n1 - n2) / (2 * eps);
    curl.x = a - b;

    //Find rate of change in XZ plane
    n1 = noise.simplex3(x, y, z + eps);
    n2 = noise.simplex3(x, y, z - eps);
    //Average to find approximate derivative
    a = (n1 - n2) / (2 * eps);
    n1 = noise.simplex3(x + eps, y, z);
    n2 = noise.simplex3(x + eps, y, z);
    //Average to find approximate derivative
    b = (n1 - n2) / (2 * eps);
    curl.y = a - b;

    //Find rate of change in XY plane
    n1 = noise.simplex3(x + eps, y, z);
    n2 = noise.simplex3(x - eps, y, z);
    //Average to find approximate derivative
    a = (n1 - n2) / (2 * eps);
    n1 = noise.simplex3(x, y + eps, z);
    n2 = noise.simplex3(x, y - eps, z);
    //Average to find approximate derivative
    b = (n1 - n2) / (2 * eps);
    curl.z = a - b;

    return curl;
  }

  //----------MOVE----------//
  function move() {
    for (i = 0; i < flakeCount; i++) {
      A.x = flakes[i].geo.position.x;
      A.y = flakes[i].geo.position.y;
      A.z = flakes[i].geo.position.z;

      cross(A, B, n);
      var mag_n = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
      flakes[i].vel_x = swirl * (n.x / mag_n);
      flakes[i].vel_y = swirl * (n.y / mag_n);

      var curl = computeCurl(
        flakes[i].geo.position.x / step,
        flakes[i].geo.position.y / step,
        flakes[i].geo.position.z / step
      );
      var mag_c = Math.sqrt(
        curl.x * curl.x + curl.y * curl.y + curl.z * curl.z
      );

      //Update flake velocity according to curl direction and fall
      flakes[i].vel_x -= fall / 4 * (curl.x / mag_c);
      flakes[i].vel_y -= fall / 4 * (curl.y / mag_c);

      if (fall > 0) {
        flakes[i].vel_z -= fall / 60;
        flakes[i].vel_z = Math.max(flakes[i].vel_z, -fall);
      } else {
        flakes[i].vel_z = 0;
      }

      flakes[i].geo.rotation.x += flakes[i].vel_x / 10 + flakes[i].vel_z / 60;
      flakes[i].geo.rotation.y += flakes[i].vel_y / 10 + flakes[i].vel_z / 60;

      var distanceFromCentre = Math.sqrt(A.x * A.x + A.y * A.y + A.z * A.z);
      if (distanceFromCentre > width / 2) {
        flakes[i].geo.visible = false;
      } else {
        flakes[i].geo.visible = true;
      }

      if (
        flakes[i].geo.position.z < -(depth / 2) ||
        Math.sqrt(A.x * A.x + A.y * A.y) > width
      ) {
        //If outside bounding volume, reset to top
        flakes[i].geo.position.x = width / 2 - Math.random() * width;
        flakes[i].geo.position.y = height / 2 - Math.random() * height;
        flakes[i].geo.position.z = depth / 2;
        flakes[i].vel_x = 0;
        flakes[i].vel_y = 0;
      } else {
        //Update flake position based on velocity
        flakes[i].geo.position.x += flakes[i].vel_x;
        flakes[i].geo.position.y += flakes[i].vel_y;
        flakes[i].geo.position.z += flakes[i].vel_z;
      }
    }
  }

  //----------DRAW----------//
  // function draw() {
  //   if (rotate) {
  //     controls.update();
  //   }
  //   move();
  //   renderer.render(scene, camera);
  //   requestAnimationFrame(draw);
  // }
  //
  // requestAnimationFrame(draw);

  // MY CODE

  // var camera = new THREE.PerspectiveCamera(
  //   75,
  //   window.innerWidth / window.innerHeight,
  //   0.1,
  //   1000
  // );

  // var geometry = new THREE.BoxGeometry(1, 1, 1);
  // var material = new THREE.MeshBasicMaterial({ color: 0x00ffdd });
  // var cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);
  //

  //
  function animate() {
    move();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
  }
  animate();
};
