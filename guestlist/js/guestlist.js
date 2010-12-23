// 
//  Legs.js | Guest List Demo
// 
//  inspired by: rialoom guest list demo ( https://github.com/kaizimmer/rialoom-demo-bundles )
// 
$( function( )
{
	new Legs.Context( $( '#app-context' ),
	{
		Events : 
		{
			// a guest name has been submitted in the form
			GUEST_SUBMITTED : 'Guest submitted',
			
			// the guest list itself has changed
			GUEST_LIST_CHANGED : 'Guest list changed'
		},
		Actors :
		{
			FormView : new Legs.View( '#guest-input',
			{
				form : 'form',
				input : '#guest-name-input'
			} ),
			FormMediator : new Legs.Mediator( function( Events, dispatch )
			{
				this.onregister = function( view )
				{
					this.events.map( view.form, 'submit', function( event )
					{
						event.preventDefault( );
						
						dispatch( new Legs.Event( Events.GUEST_SUBMITTED, view.input.val( ) ) );
						
						view.input.val( '' );
					} );
				};
			} ),
			GuestListModel : new Legs.Model( function( Events, dispatch )
			{
				this._guests = [ ];
				
				this.addGuest = function( name )
				{
					this._guests.push( name );
					
					dispatch( new Legs.Event( Events.GUEST_LIST_CHANGED ) );
				};
				
				this.getList = function( )
				{
					return this._guests.slice( );
				};
			} )
		},
		Startup : function( Events, CommandMap, Actors, Injector, MediatorMap, ContextView )
		{
			MediatorMap.MapView( Actors.FormView, Actors.FormMediator );
			
			Injector.MapSingleton( Actors.GuestListModel );
			
			CommandMap.MapEvent( Events.GUEST_SUBMITTED, function( event )
			{
				var model = Injector.Get( Actors.GuestListModel );
				
				model.addGuest( event.data );
			} );
			
			CommandMap.MapEvent( Events.GUEST_LIST_CHANGED, function( event )
			{
				var model = Injector.Get( Actors.GuestListModel );
				
				var list = model.getList( );
				
				// since the guest list doesn't have any outward interaction (yet),
				// we don't really need to mediate it
				var html = "<ul>";
				
				for( var i = 0; i < list.length; i++ )
				{
					html += "<li>" + list[ i ] + "</li>";
				}
				
				$( '#guest-list' ).html( html + '</ul>' );
			} );
		}
	} );
} );