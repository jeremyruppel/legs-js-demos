$( function( )
{
	new Legs.Context( '#todoapp',
	{
		Events :
		{
			// a new todo has been submitted
			TODO_SUBMITTED : 'Todo submitted',
			
			// a new todo has been added to the list
			TODO_ADDED : 'Todo added',
			
			// a new todo has been displayed
			TODO_DISPLAYED : 'Todo displayed',
			
			// a todo has been selected to be deleted
			TODO_DESTROYED : 'Todo destroyed',
			
			// a todo has been removed from the list
			TODO_REMOVED : 'Todo removed',
			
			// a todo has been toggled
			TODO_TOGGLED : 'Todo toggled',
			
			// a todo has been edited
			TODO_EDITED : 'Todo edited',
			
			// a todo model has been changed in some way
			TODO_CHANGED : 'Todo changed'
		},
		Actors :
		{
			TodoList : new Legs.Model( function( Events, dispatch )
			{
				this._collection = [ ];
				
				this.add = function( todo )
				{
					this._collection.push( todo );
					
					dispatch( new Legs.Event( Events.TODO_ADDED, todo ) );
				};
				
				this.remove = function( todo )
				{
					this._collection.splice( this._collection.indexOf( todo ), 1 );
					
					dispatch( new Legs.Event( Events.TODO_REMOVED, todo ) );
				};
			} ),
			TodoModel : new Legs.Model( function( Events, dispatch )
			{
				var field = function( name, changed )
				{
					this[ name ] = function( val )
					{
						if( null === val || undefined === val )
						{
							return this[ '_' + name ];
						}
						else
						{
							this[ '_' + name ] = val;
							
							if( changed ) changed.call( this, val );
							
							return this;
						}
					};
				};
				
				field.call( this, 'text', function( val )
				{
					dispatch( new Legs.Event( Events.TODO_CHANGED, this ) );
				} );
				
				field.call( this, 'done', function( val )
				{
					dispatch( new Legs.Event( Events.TODO_CHANGED, this ) );
				} );
			} ),
			TodoDictionary : new Legs.Model( function( Events, dispatch )
			{
				Legs.Utils.Mixin( this, new Legs.Utils.Dictionary( ) );
			} ),
			FormView : new Legs.View( '#create-todo',
			{
				input   : '#new-todo',
				tooltip : '.ui-tooltip-top'
			} ),
			FormMediator : new Legs.Mediator( function( Events, dispatch )
			{
				this.onregister = function( view )
				{
					this.events.map( view.input, Events.KEY_PRESS, function( event )
					{
						if( event.keyCode == 13 )
						{
							dispatch( new Legs.Event( Events.TODO_SUBMITTED, view.input.val( ) ) );
							
							view.input.val( '' );
						}
					} );
					
					this.events.map( view.input, Events.KEY_UP, function( event )
					{
						view.tooltip.fadeOut( );
						
						if( this.tooltipTimeout )
						{
							clearTimeout( this.tooltipTimeout );
						}
						
						if( !( view.input.val( ) == '' || view.input.val( ) == view.input.attr( 'placeholder' ) ) )
						{
							this.tooltipTimeout = setTimeout( function( )
							{
								view.tooltip.fadeIn( );
							},
							1000 );
						}
					} );
				};
			} ),
			TodoView : new Legs.View( 'li.todo',
			{
				check : '.check',
				content : '.todo-content',
				destroy : '.todo-destroy',
				input : '.todo-input'
			},
			function( todo )
			{
				var template = '<div class="todo"><div class="display"><input class="check" type="checkbox" /><div class="todo-content"></div><span class="todo-destroy"></span></div><div class="edit"><input class="todo-input" type="text" value="" /></div></div>';
				
				this.root.html( template );
				
				this.createChildren( );
				
				this.content.text( todo.text( ) );
				
				this.input.val( todo.text( ) );
				
				if( todo.done( ) )
				{
					this.root.addClass( 'done' );
					
					this.check.attr( 'checked', 'checked' );
				}
				else
				{
					this.root.removeClass( 'done' );
					
					this.check.attr( 'checked', null );					
				}
				
				return this.element;
			} ),
			TodoMediator : new Legs.Mediator( function( Events, dispatch )
			{
				this.onregister = function( view )
				{
					this.events.map( view.check, Events.CLICK, function( event )
					{
						dispatch( new Legs.Event( Events.TODO_TOGGLED, { view : view, checked : view.check.attr( 'checked' ) } ) );
					} );
					
					this.events.map( view.content, Events.DOUBLE_CLICK, function( event )
					{
						view.root.addClass( 'editing' );
						
						view.input.focus( );
					} );
					
					this.events.map( view.input, Events.BLUR, function( event )
					{
						view.root.removeClass( 'editing' );
						
						dispatch( new Legs.Event( Events.TODO_EDITED, { view : view, text : view.input.val( ) } ) );
					} );
					
					this.events.map( view.input, Events.KEY_PRESS, function( event )
					{
						if( event.keyCode == 13 )
						{
							view.root.removeClass( 'editing' );
							
							dispatch( new Legs.Event( Events.TODO_EDITED, { view : view, text : view.input.val( ) } ) );
						}
					} );
					
					this.events.map( view.destroy, Events.CLICK, function( event )
					{
						dispatch( new Legs.Event( Events.TODO_DESTROYED, view ) );
					} );
					
					dispatch( new Legs.Event( Events.TODO_DISPLAYED, view ) );
				};
			} )
		},
		Startup : function( Events, CommandMap, Actors, Injector, MediatorMap, ContextView )
		{
			Injector.MapSingleton( Actors.TodoList );
			
			Injector.MapSingleton( Actors.TodoDictionary );
			
			Injector.MapClass( Actors.TodoModel );
			
			MediatorMap.MapView( Actors.FormView, Actors.FormMediator );
			
			MediatorMap.MapView( Actors.TodoView, Actors.TodoMediator );
			
			// when a new todo is submitted, we need to create a new model,
			// assign its text to the entered text, and add it to our todo list
			CommandMap.MapEvent( Events.TODO_SUBMITTED, function( event )
			{
				var list = Injector.Get( Actors.TodoList );
				
				var model = Injector.Get( Actors.TodoModel );
				
				list.add( model.text( event.data ) );
			} );
			
			// when a todo is added to the todo list, we need to create
			// a view for it. here, we temporarily map the view's element
			// to the todo model so we can keep the association once
			// the view is mediated
			CommandMap.MapEvent( Events.TODO_ADDED, function( event )
			{
				var dict = Injector.Get( Actors.TodoDictionary );

				var model = event.data;
				
				var element = Actors.TodoView.createElement( );
				
				dict.put( element, model );
				
				$( '#todo-list' ).append( element );
			} );
			
			// when a view is mediated, we move the association between
			// the view's element and the model and create new ones between
			// the proper view and model, then we render the view
			CommandMap.MapEvent( Events.TODO_DISPLAYED, function( event )
			{
				var dict = Injector.Get( Actors.TodoDictionary );
				
				var view = event.data;
				
				var model = dict.get( view.element );
				
				dict.remove( view.element );
				
				dict.put( view, model );
				dict.put( model, view );
				
				view.render( model );
			} );
			
			// when a view is destroyed, we need to remove it from the
			// todo list
			CommandMap.MapEvent( Events.TODO_DESTROYED, function( event )
			{
				var dict = Injector.Get( Actors.TodoDictionary );
				
				var list = Injector.Get( Actors.TodoList );
				
				var view = event.data;
				
				var model = dict.get( view );
				
				list.remove( model );
			} );
			
			// when a todo is removed from the list, remove the view from
			// the dom and remove the view and model from the dictionary
			CommandMap.MapEvent( Events.TODO_REMOVED, function( event )
			{
				var dict = Injector.Get( Actors.TodoDictionary );
				
				var model = event.data;

				var view = dict.get( model );

				view.root.remove( );

				dict.remove( model );
				dict.remove( view );
			} );
			
			// when a view is toggled, toggle that view's model
			CommandMap.MapEvent( Events.TODO_TOGGLED, function( event )
			{
				var dict = Injector.Get( Actors.TodoDictionary );
				
				var model = dict.get( event.data.view );
				
				model.done( event.data.checked );
			} );
			
			// when a view is edited, set text on that view's model
			CommandMap.MapEvent( Events.TODO_EDITED, function( event )
			{
				var dict = Injector.Get( Actors.TodoDictionary );
				
				var model = dict.get( event.data.view );
				
				model.text( event.data.text );
			} );
			
			// when a model is updated, update the corresponding view
			CommandMap.MapEvent( Events.TODO_CHANGED, function( event )
			{
				var dict = Injector.Get( Actors.TodoDictionary );
				
				if( dict.has( event.data ) )
				{
					var view = dict.get( event.data );
					
					view.render( event.data );
				}
			} );
		}
	} );
} );