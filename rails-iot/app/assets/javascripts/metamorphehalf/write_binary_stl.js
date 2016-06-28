// Written by Paul Kaplan

var BinaryStlWriter = (function() {
  var that = {};

  var writeVector = function(dataview, offset, vector, isLittleEndian) {
    offset = writeFloat(dataview, offset, vector.x, isLittleEndian);
    offset = writeFloat(dataview, offset, vector.y, isLittleEndian);
    return writeFloat(dataview, offset, vector.z, isLittleEndian);
  };

  var writeFloat = function(dataview, offset, float, isLittleEndian) {
    dataview.setFloat32(offset, float, isLittleEndian);
    return offset + 4;
  };

  var geometryToDataView = function(geometry) {
    var tris = geometry.faces;
    var verts = geometry.vertices;
    console.log("Saving", tris.length, verts.length)
    
    var isLittleEndian = true; // STL files assume little endian, see wikipedia page
    
    var bufferSize = 84 + (50 * tris.length);
    var buffer = new ArrayBuffer(bufferSize);
    var dv = new DataView(buffer);
    var offset = 0;

    offset += 80; // Header is empty

    dv.setUint32(offset, tris.lengtb, isLittleEndian);
    offset += 4;

    for(var n = 0; n < tris.length; n++) {
      // console.log(tris[n].normal);
      offset = writeVector(dv, offset, tris[n].normal, isLittleEndian);
      offset = writeVector(dv, offset, verts[tris[n].a], isLittleEndian);
      offset = writeVector(dv, offset, verts[tris[n].b], isLittleEndian);
      offset = writeVector(dv, offset, verts[tris[n].c], isLittleEndian);
      offset += 2; // unused 'attribute byte count' is a Uint16
    }
    return dv;
  };

  var save = function(geometry, filename) {
    var dv = geometryToDataView(geometry);
    var blob = new Blob([dv], {type: 'application/octet-binary'});

    // FileSaver.js defines `saveAs` for saving files out of the browser
    saveAs(blob, filename);
  };


  that.save = save;
  return that;
}());


var AsciiStlWriter = (function() {
  var that = {};
  // ASCI STL files
  function stringifyVector(vec){
    return ""+vec.x+" "+vec.y+" "+vec.z;
  }
 
  function stringifyVertex(vec){
    return "vertex "+stringifyVector(vec)+" \n";
  }
 
  function geometryToStlString(geom){
    var vertices = geom.vertices;
    var tris     = geom.faces;
 
    var stl = "solid pixel";
    for(var i = 0; i<tris.length; i++){
      stl += ("facet normal "+stringifyVector( tris[i].normal )+" \n");
      stl += ("outer loop \n");
      stl += stringifyVertex(vertices[tris[i].a]);
      stl += stringifyVertex(vertices[tris[i].b]);
      stl += stringifyVertex(vertices[tris[i].c]);
      stl += ("endloop \n");
      stl += ("endfacet \n");
    }
    stl += ("endsolid");
 
    return stl
  }
 
 
  var save = function(geometry, filename) {
    var stlString = geometryToStlString(geometry);
    var blob = new Blob([stlString], {type: 'text/plain'});
    saveAs(blob, filename);
  }
  
  that.save = save;
  return that;
}());