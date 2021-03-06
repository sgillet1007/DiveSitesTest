$(document).on('ready', function(){
	
	//************************************Nav bar interaction *********************************
	$('.button').on('click', function() {
    	$('.content').toggleClass('isOpen');
  	});

  	$('.nav').children().removeClass('active');
  	$('.nav-new-dive').addClass('active');

//****************************************************************************************
	var map = L.map('leaflet-map').setView([18,-69],4);
	var editMode = false;
	
	map.on('click', onMapClick);
	
	
	// **************************  MAP TILE LAYERS  *************************************
	var Esri_NatGeoWorldMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
		maxZoom: 16
	});

	var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
	
	Esri_NatGeoWorldMap.addTo(map);

	// custom map marker icon *********************************************************
	var diveIcon = L.icon({
		iconUrl: '/images/scubadiving2.png',
		iconSize:     [17, 26], // size of the icon
		iconAnchor:   [8, 28], // point of the icon which will correspond to marker's location
		popupAnchor:  [5, -30] // point from which the popup should open relative to the iconAnchor
	});
	// *************************************************************************************
	
	$('.newDive').on('click', function(){
		editMode = !editMode;
		// $('.newDive').css('visibility':'hidden');
	});

	var currentName = "";
	var currentLat = "";
	var currentLng = "";
	var searchID = 1;
	var circleLayer = new L.LayerGroup();

	function onMapClick(e) {
		currentName = "";
		currentLat = "";
		currentLng = "";
		var searchVar = searchID.toString();
		searchVar = L.circle([e.latlng.lat, e.latlng.lng], 40233, { 
				        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.3
                    	});
		searchVar.addTo(circleLayer);
		circleLayer.addTo(map);
		++searchID;
		if (editMode === true){
			$.ajax({
				method  : 'GET',
				url     : '/getSites',
				data    : {lat : e.latlng.lat, lng : e.latlng.lng},
				success : function(data){
					var parsed = JSON.parse(data);
					$('#dive-select').empty();
					$('#dive-select').prepend('<h3 class="instruction-text">What site did you dive?...</h3>');
					editMode = false;
					parsed.sites.forEach(function(i){
						$('#dive-select').css({'display':'block'});
						$('#dive-select').append('<div class="select-dive-item" id="'+i.id+'" data-lat="' + i.lat + '"data-lng="'+ i.lng +'"data-name="'+i.name+'">'+i.name+'</div>');
					});
					circleLayer.removeLayer(searchVar);
				}
			});
		}  
	}
	//click handler for dive select 
	$(document).on('click','.select-dive-item', function(){
		map.removeLayer(circleLayer);

		//refactor idea. create one global object, and add 3 properties, instead of 3 seperate global vars
		currentName = $(this).data('name');
		currentLat = $(this).data('lat');
		currentLng = $(this).data('lng');

		//outlines selected dive site in red
		$(this).css({"border":"2px solid red"});
		//hides dive form
		$('#dive-select').hide();
		//show dive form
		$('#dive-form').show(600);
		//adds marker to map at dive location
		var marker = L.marker([$(this).data('lat'),$(this).data('lng')],{icon: diveIcon}).addTo(map);
		//binds popup to marker
		marker.bindPopup('<strong>Selected Site: </strong><br>'+ $(this).data('name')).openPopup();
	});
	// form submit handler
	$(document).on('submit','.dive-form-data', function(e){
		e.preventDefault();
		var formData = $(this).serializeArray();
		formData.push({"name": "diveSite", "value": currentName});
		formData.push({"name": "diveLat", "value": currentLat});
		formData.push({"name": "diveLng", "value": currentLng});
		// console.log(formData);
		// console.log("Current Dive:",currentName);
		$('#dive-form').hide(300);
		// $('.newDive').css('visibility':'visible');
		
		$.ajax({
			method   : 'POST',
			url      : '/postDive',
			data     : formData 
		})
	})
});