// Collection to keep the todos
Todos = new Mongo.Collection('todos');

if (Meteor.isClient) {
    
    // ALL TEMPLATE HELPERS
    Template.todoapp.helpers({
        todos: function(){
            return Todos.find().count();
        }
    });
    
    Template.main.helpers({
        todos: function(){
            return Todos.find();
        }
    });
    
    Template.todo.helpers({
        editing: function(){
            return Session.get("editing_todo") === this._id;
        }
    });
    
    Template.footer.helpers({
        todos_not_completed: function(){
            return Todos.find({completed: false}).count();
        },
        todos_completed: function(){
            return Todos.find({completed: true}).count();
        }
    });
    
    // ALL TEMPLATE EVENTS
    Template.todoapp.events({
        'keypress #new-todo': function (evt, template) {
            if (evt.which === 13) {
                Dispatcher.dispatch({
                    actionType: "TODO_CREATE",
                    title: $('#new-todo').val()
                });
                evt.target.value = '';
            }
        }
    });
    
    Template.todo.events({
        'click .destroy': function() {
            Dispatcher.dispatch({
                actionType: "TODO_DESTROY",
                id: this._id
            });
        },
        'click .toggle': function(){
            Dispatcher.dispatch({
                actionType: "TODO_TOGGLE",
                id: this._id
            });
        },
        'dblclick label': function() {
            Dispatcher.dispatch({
                actionType: "TODO_EDITING",
                id: this._id
            });
		},
        'keypress .edit': function(evt) {
            if (evt.which === 13) {
                Dispatcher.dispatch({
                    actionType: "TODO_UPDATE",
                    id: this._id,
                    updates: {
                        title: $('.' + this._id).val()
                    }
                });
            }
        },
        'blur .edit': function(evt) {
            Dispatcher.dispatch({
                actionType: "TODO_UPDATE",
                id: this._id,
                updates: {
                    title: $('.' + this._id).val()
                }
            });
        }
    });
    
    Template.footer.events({
        'click #clear-completed': function(){
            Dispatcher.dispatch({
                actionType: "TODO_DESTROY_COMPLETED"
            });
        }
    });
    
    // For debugging purposes
    Dispatcher.register(function(payload){
        console.log("Dispatcher received action with payload: ", payload);
    });
}


// TodoStore Callbacks
Dispatcher.register(function(payload){
    
    switch(payload.actionType) {

        case "TODO_CREATE":
            TodoStore.create(payload.title);
            break;

        case "TODO_TOGGLE":
            TodoStore.toggle(payload.id);
            break;
            
        case "TODO_EDITING":
            TodoStore.editing(payload.id);
            break;

        case "TODO_UPDATE":
            TodoStore.update(payload.id, payload.updates);
            break;

        case "TODO_DESTROY":
            TodoStore.destroy(payload.id);
            break;

        case "TODO_DESTROY_COMPLETED":
            TodoStore.destroyCompleted();
            break;

        default:
          // no op
      }
});

// TodoStore Methods
TodoStore = {
    create: function(title) {
        Todos.insert({
            title: title, 
            completed: false, 
            created_at: new Date().getTime()
        });
    },
    update: function(id, updates) {
        Todos.update(id, {$set: updates});
        Session.set("editing_todo", null);
    },
    toggle: function(id){
        var completed = Todos.findOne(id).completed;
        Todos.update(id, {$set: {completed: !completed}});
    },
    editing: function(id){
        if ( !Todos.findOne(id).completed ) {
            Session.set("editing_todo", id);
        }
    },
    destroy: function(id) {
        Todos.remove(id);
    },
    destroyCompleted: function() {
        Meteor.methods({
            'Todos.removeAll': function(){
                Todos.remove({completed:true});
            }
        });
        Meteor.call('Todos.removeAll');
    }
};