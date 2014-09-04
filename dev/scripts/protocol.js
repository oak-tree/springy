self.addEventListener('message',  function(event){
	
	/* get graph data from event.data.graph*/
	var data = {}  

	switch (event.data.type) {
			case "start":
				
				layout = createLayout(JSON.parse(event.data.params));
				
				/* run it */
				layout.start();
				break;
			case "restart":
				layout.restart()
				break;
			case "stop":
				/* stop layout */
				layout.stop();
				break;
			case "destroy":
				/* stop layout */
				self.close();
				break;
			case "change":
				layout.change(event.data.eventname,JSON.parse(event.data.eventobj)); 
				break;
			case "update":
				var nodeData = JSON.parse(event.data.nodeData);
				layout.update(nodeData);
				/* update graph data*/
				//TODO update the graph data
	}
});
