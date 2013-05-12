var PlaneManager = {
	planeStack: [],
	pushPlane: function(plane){
		this.planeStack.push(plane);
	}
}

window.onresize = function(){
	for(var i in PlaneManager.planeStack){
		PlaneManager.planeStack[i].reflow(false);
	}
}

var DateFormatter = {
	intToRoman: function(integer){
		switch(integer){
			case 1:
				return "I";
				break;
			case 2: 
				return "II";
				break;
			case 3:
				return "III";
				break;
			case 4:
				return "IV";
				break;
			case 5:
				return "V";
				break;
			case 6: 
				return "VI";
				break;
			case 7:
				return "VII";
				break;
			case 8:
				return "VIII";
				break;
			case 9:
				return "IX";
				break;
			case 10:
				return "X";
				break;
			case 11:
				return "XI";
				break;
			case 12:
				return "XII";
				break;				
		}
	},
	polish: function(date){
		return date.getDate() + " " + this.intToRoman(date.getMonth()) + " " + date.getFullYear()
	}
}

function Plane(container){
	var self = this;
	PlaneManager.pushPlane(this);
	this.spacing = 50;
	this.animationDelay = 50;
	this.opacityStep = 0.2;
	this.scaleStep = 0;
	this.grayStep = 0.6;
	this.v_padding=10;
	var self = this;
	this.container = container;
	this.cardStack = [];
	this.largestCardID = 0;
	this.newPlanarID = function(){
		return self.largestCardID++;
	}
	this.addCard = function(id){
		var card = new Card(id, self, self.newPlanarID());
		card.body.transition({scale: 0.8, opacity:0}, 0);
		self.cardStack.push(card);
		this.container.append(card.body);
		this.reflow();
	}
	this.reflow = function(animated, delayed){
		if(animated==undefined){
			animated = true;
		}
		if(delayed == undefined){
			delayed= true;
		}
		var length = self.cardStack.length;
		var width = this.container.width();
		for(var i = length -1; i>=0; i--){
			var card = self.cardStack[i];
			var step = (length-i-1);//for main card it is set to 0;
			var cardWidth = parseInt(card.width);
			var offset = width/2 + step * cardWidth - cardWidth/2;
			if(i!=length-1){
				offset+=self.spacing * step;
				card.active=false;
			}else{
				card.active=true;
			}
			var gray = 0 + step * self.grayStep;
			var opacity = 1 - step * self.opacityStep;
			var scale = 1 - step * self.scaleStep;
			var css = {right: offset + "px", scale:scale, opacity:opacity, "-webkit-filter":"grayscale("+gray+")"};
			if(animated){
				if(delayed) css["delay"] =step*self.animationDelay;
				card.body.transition(css);
			}else{
				card.body.css(css);
			}
			var max_con_height = self.container.height() - 2*self.v_padding - card.titleContainer.body.height() -40; //dirty dirty hack;
			card.contentContainer.css({"max-height": max_con_height});
			//card.refreshSize();
		}
		$(".nano").nanoScroller();
	};
	this.popCard = function(){
		card = self.cardStack.pop();
		card.pop();
		self.reflow(true, false);
	}
	this.closeCard = function(card){
		for(var i in self.cardStack){
			var cardL = self.cardStack[i];
			if(cardL.planar_id==card.planar_id){
				self.cardStack.splice(i, 1);
				card.pop();
				self.reflow();
				break;
			}
		}
	}
	this.getCardByID = function(id){
		var cardStack = self.cardStack;
		for(var i in cardStack){
			var card = cardStack[i];
			if (card.planar_id==id){
				return card;
			}
		}
		return 0;
	};
}

function Card(id, plane, planar_id){
	var self = this;
	this.active = false;
	this.planar_id = planar_id;
	this.id = id;
	this.color = "rgb(93, 142, 204)";
	this.lastEdited = new Date();
	this.type = "list";
	this.plane = plane;
	this.body = $("<card></card>").addClass("nano");//.html("i have id of " + id);	
	this.titleContainer = new CardTitle(this);
	this.body.append(this.titleContainer.body);
	this.width = "400px";
	this.minHeight = 300;
	this.body.css({width: this.width});
	this.contentContainer = $("<div></div>").addClass("content").css({"overflow-y": "auto"});//.css({height: "calc(100% - 100px)"});
	this.heightPlaceholder = $("<div></div>").addClass("heightPlaceholder").appendTo(this.body).css({position:"relative", "padding-top":this.titleContainer.height});
	this.f = function(){
		return "lol";
	}
	this.getPlanarID = function(){
		return self.planar_id;
	}
	this.pop = function(){
		this.body.transition({scale: 1.5, opacity: 0}, 200, function(){
			self.body.remove();
		});
	}
	this.close = function(){
		this.plane.closeCard(self);
	};	
	switch(this.type){
		case "note":
			this.content = new Note(this);
			break;
		case "list":
			this.content = new List(this);
			break;
	}
	this.content.body.css({"padding-bottom": "30px"});
	this.contentContainer.append(this.content.body);
	this.body.append(this.contentContainer);
	this.contentContainer;//.nanoScroller();
	this.getContent = function(){
		return self.content;
	}
}

function CardTitle(card){
	var self = this;
	this.parent = card;
	this.body = $("<div></div>").addClass("cardTitleContainer");
	this.colorBar = $("<div></div>").appendTo(this.body).addClass("cardTitleBar").css({"background-color":this.parent.color});
	this.titleSpan = $("<span contenteditable=true></span>").appendTo(this.body).addClass("title_span").text("Healthy lifestyle(" + this.parent.id + ")");
	this.dateSpan = $("<span></span>").appendTo(this.body).addClass("date_span").text("last edited: " + DateFormatter.polish(this.parent.lastEdited));
	this.optionsPane = $("<div></div>").appendTo(this.body).addClass("card_options").css({opacity:0, display: "table"});
	this.closeButton = $("<div></div>").appendTo(this.optionsPane).css({display: "table-cell"}).addClass("clickable").text("x");
	this.closeButton.click(function(e){
		if(self.parent.active==true){
			e.preventDefault();
			self.parent.close();
			return false;
		}
	});
	this.body.mouseenter(function(){
		if(self.parent.active == true){
			self.optionsPane.transition({opacity:1, queue:false}, 200);
		}
	});
	this.body.mouseleave(function(){
		self.optionsPane.transition({opacity: 0, queue:false}, 200);
	});
}

function Note(card){
	var self = this;
	this.parent = card;
	this.body = $("<div></div>").css({height:"100%"});
	this.editable = $("<div contenteditable=true></div>").addClass("note_editable").appendTo(this.body).css({height:"100%"});
	this.empty = true;
	if(this.empty){
		this.editable.append("<span></span>").addClass("placeholder").text("type something here...");
	}
	this.editable.click(function(e){
		if(self.parent.active==true){
			if(self.empty == true){
				self.editable.html("");
				self.empty=false;
			}
			return false;
		}else{
			e.preventDefault();
		}
	});
}

function List(card){
	var self = this;
	this.parent = card;
	this.body = $("<div></div>");
	this.list = $("<ul></ul>").attr("indent", 0).addClass("list").appendTo(this.body);
	this.itemsStack = [];
	this.latestIndex = 0;
	this.index = {};
	this.newRow = function(text, afterItem, focus){
		if(text==undefined){
			text =="";
		}	
		if(focus==undefined){
			focus==false;
		}
		var row = new ListItem(this);
		this.itemsStack.push(row);
		row.setListWideID(self.latestIndex++);
		row.setText(text);
		if(afterItem==undefined){
			self.list.append(row.body);
		}else{
			afterItem.body.after(row.body);
		}
		if(focus){
			row.span.focus();
		}
	}
	this.getRowByID = function(id){
		for(var i in self.itemsStack){
			var item = self.itemsStack[i];
			if(item.listWide_id == id){
				return item;
			}
		}
		return 0;
	}
	//to be removed in production:
	this.newRow("Apple");
	this.newRow("Banana");
	this.newRow("Horse");
	/*this.newRow("Hamster");
	this.newRow("A dentist");
	this.newRow("Steaven Seagull");
	this.newRow("Warrior");
	this.newRow("This Riffle");
	/*this.newRow("Apple");
	this.newRow("Banana");
	this.newRow("Horse");
	this.newRow("Hamster");
	this.newRow("A dentist");
	this.newRow("Steaven Seagull");
	this.newRow("Warrior");
	this.newRow("This Riffle"); */
	//
	this.update = function(){
		self.enumerate(self.list, 0);
		self.performIndex(self.index, self.list);
	};
	this.enumerate = function(list, indent){
		$(list).find("li").each(function(){
			$(this).attr("indent", indent);
		});	
		if($(list).find("ul").length!=0) self.enumerate($(list).find("ul"), indent+1);
	};
	this.performIndex = function(index, list){
		index.children = [];
		$(list).find("li").each(function(){
			var object = {
				content: $(this).text()
			}
			index.children.push(object);
			if($(this).find("ul").length!=0){
				self.performIndex(object, $(this).find("ul"));
			}
		});	
	}
	this.updateRow = function(element){
		var plane = PlaneManager.planeStack[0];//should choose proper plane in production in order to enable multiple planes
		var card = plane.getCardByID($(element).attr("planar_id")); 
		var list = card.getContent();
		list.update();
		//var item = list.getRowByID($(element).attr("listwide_id"));
		//item.updateIndent();
		
	}
	this.list.nestedSortable({
		forcePlaceholderSize: true, 
		placeholder: "list_placeholder", 
		handle:".list_handle", 
		items: "li", 
		toleranceElement: "div", 
		listType:"ul",
		update: function(event, ui){self.updateRow(ui.item)}
	});
	this.getJSON = function(){
		return JSON.stringify(self.index);
	}
}

function ListItem(list){
	var self = this;
	this.parent = list;
	this.listWide_id;
	this.index;
	this.indent=0;
	this.planar_id = this.parent.parent.planar_id;
	this.body = $("<li></li>").addClass("list_item").attr("indent", this.indent).attr("listwide_id", this.listWide_id).attr("planar_id", this.planar_id);
	this.table = $("<table></table>").appendTo(this.body).addClass("list_item_table");
	this.handleCell = $("<td></td>").addClass("list_handle_cell").appendTo(this.table);
	this.handle = $("<div></div>").appendTo(this.handleCell).addClass("list_handle");
	this.spanCell = $("<td></td>").appendTo(this.table);
	this.span = $("<span contenteditable=true></span>").addClass("list_span").appendTo(this.spanCell);
	this.span.focus(function(){
		self.table.addClass("list_item_table_edited");
	});
	this.span.blur(function(){
		self.table.removeClass("list_item_table_edited");
	});
	this.span.keydown(function(e){
		console.log(self.parent.parent);
		//self.parent.parent.refreshSize();
		var keycode = e.which;
		var offset = window.getSelection().getRangeAt(0).startOffset;
		//console.log(e);
		if(keycode ==13){
			var shift = e.shiftKey;
			if(shift){
				var text = self.span.html();
				range = window.getSelection().getRangeAt(0);
			}else{
				//window.getSelection().getRangeAt(0).startContainer.parentNode;
				self.appendNewItem();
				return false;
			}
			//range.insertNode($("<span>fuck</span>")[0]);
		}
	});
	this.span.click(function(e){
		return false;
	});
	this.setText = function(text){
		self.span.text(text);
	}
	this.setIndent = function(indent){
		self.indent = indent;
		self.body.attr("indent", indent);
	}
	this.updateIndent = function(){
		var indent = undefined;
		var element = this.body.parent();
		while(indent==undefined){
			indent = element.attr("indent");
			element = element.parent();
		}
		this.setIndent(++indent);
	}
	this.setListWideID = function(id){
		self.listWide_id = id;
		self.body.attr("listwide_id", id);
	}
	this.appendNewItem = function(){
		self.parent.newRow("", self, true);
	}
}










