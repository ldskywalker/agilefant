/**
 * Iteration controller.
 * 
 * @constructor
 * @base BacklogController
 * @param {Integer} id Iteration id.
 * @param {DOMElement} element DOM parent node for the story table. 
 */
var IterationController = function IterationController(options) {
  this.id = options.id;
  this.parentView = options.storyListElement;
  this.iterationInfoElement = options.backlogDetailElement;
  this.assigmentListElement = options.assigmentListElement;
  this.taskListElement = options.taskListElement;
  this.hourEntryListElement = options.hourEntryListElement;
  this.metricsElement = options.metricsElement;
  this.smallBurndownElement = options.smallBurndownElement;
  this.burndownElement = options.burndownElement;
  this.tabs = options.tabs;
  this.init();
  this.initAssigneeConfiguration();
  this.initializeStoryConfig();
  this.initIterationInfoConfig();
  this.initializeTaskListConfig();
  this.paint();
  var me = this;
  this.tabs.bind('tabsselect', function(event, ui) {
    if (Configuration.isTimesheetsEnabled() && ui.index === 2) {
      me.selectSpentEffortTab();
    } else if(ui.index === 1) {
      me.selectAssigneesTab();
    }
  });
  window.pageController.setMainController(this);
};
IterationController.columnIndices = {
  name: 0,
  statDate: 1,
  endDate: 2,
  plannedSize: 3,
  baselineLoad: 4,
  assignees: 4
};
IterationController.columnConfigs = {
  name: {
    title : "Name",
    get : IterationModel.prototype.getName,
    editable : true,
    edit : {
      editor : "Text",
      required: true,
      set: IterationModel.prototype.setName
    }
  },
  startDate: {
    title : "Start Date",
    get : IterationModel.prototype.getStartDate,
    decorator: DynamicsDecorators.dateTimeDecorator,
    editable : true,
    edit : {
      editor : "Date",
      size: '18ex',
      decorator: DynamicsDecorators.dateTimeDecorator,
      required: true,
      withTime: true,
      set: IterationModel.prototype.setStartDate
    }
  },
  endDate: {
    title : "End Date",
    get : IterationModel.prototype.getEndDate,
    decorator: DynamicsDecorators.dateTimeDecorator,
    editable : true,
    edit : {
      editor : "Date",
      decorator: DynamicsDecorators.dateTimeDecorator,
      required: true,
      withTime: true,
      size: '18ex',
      set: IterationModel.prototype.setEndDate
    }
  },
  plannedSize: {
    title : "Planned Size",
    get : IterationModel.prototype.getBacklogSize,
    decorator: DynamicsDecorators.exactEstimateDecorator,
    editable: true,
    edit: {
      editor: "ExactEstimate",
      decorator: DynamicsDecorators.exactEstimateEditDecorator,
      size: '10ex',
      set : IterationModel.prototype.setBacklogSize
    }
  },
  baselineLoad: {
    title : "Baseline load",
    get : IterationModel.prototype.getBaselineLoad,
    decorator: DynamicsDecorators.exactEstimateDecorator,
    editable: true,
    edit: {
      editor: "ExactEstimate",
      decorator: DynamicsDecorators.exactEstimateEditDecorator,
      size: '10ex',
      set : IterationModel.prototype.setBaselineLoad
    }
  },
  assignees: {
    title : "Assignees",
    headerTooltip : 'Project assignees',
    get : BacklogModel.prototype.getAssignees,
    decorator: DynamicsDecorators.assigneesDecorator,
    editable: true,
    openOnRowEdit: false,
    edit: {
      editor : "Autocomplete",
      dialogTitle: "Select users",
      dataType: "usersAndTeams", 
      set : BacklogModel.prototype.setAssignees
    }
  },
  description: {
    title : "Description",
    get : IterationModel.prototype.getDescription,
    editable : true,
    decorator: DynamicsDecorators.onEmptyDecoratorFactory("(Empty description)"),
    edit : {
      editor : "Wysiwyg",
      set: IterationModel.prototype.setDescription
    }
  }
 };

IterationController.prototype = new BacklogController();


IterationController.prototype.removeIteration = function() {
  var me = this;
  var dialog = new LazyLoadedFormDialog();
  dialog.init({
    title: "Delete iteration",
    url: "ajax/deleteIterationForm.action",
    disableClose: true,
    data: {
      IterationId: me.model.getId()
    },
    okCallback: function(extraData) {
      var confirmation = extraData.confirmationString;
      if (confirmation && confirmation.toLowerCase() == 'yes') {
        window.location.href = "deleteIteration.action?confirmationString=yes&iterationId=" + me.model.getId();
      }
    },
    closeCallback: function() {
      dialog.close();
    }
  });
};



IterationController.prototype.handleModelEvents = function(event) {
  if (event instanceof DynamicsEvents.MetricsEvent 
      || event instanceof DynamicsEvents.RelationUpdatedEvent) {
    if(event.getObject() instanceof TaskModel) {
      this.reloadMetrics();
    }
    if(event.getObject() instanceof StoryModel) {
      this.reloadMetricsBox();
    }
  }
  if(event instanceof DynamicsEvents.RankChanged && event.getRankedType() === "story") {
    var me = this;
    this.model.reloadStoryRanks(function() {
      me.storyListView.resort();
    });
  }
};
IterationController.prototype.isAssigneesTabSelected = function() {
  return (this.tabs.tabs("option","selected") === 1);
};

IterationController.prototype.paintIterationInfo = function() {
  this.iterationInfoView = new DynamicVerticalTable(this, this.model, this.iterationDetailConfig, this.iterationInfoElement);
  this.iterationInfoView.render();
};

IterationController.prototype.reloadBurndown = function() {
  var href = this.burndownElement.attr("src");
  this.burndownElement.attr("src", href+"#");
  href = this.smallBurndownElement.attr("src");
  this.smallBurndownElement.attr("src", href+"#");
};
IterationController.prototype.reloadMetricsBox = function() {
  this.metricsElement.load("ajax/iterationMetrics.action", {iterationId: this.id});
  this.reloadBurndown();
};

IterationController.prototype.reloadMetrics = function() {
  this.reloadBurndown();
  this.reloadMetricsBox();
  if(this.isAssigneesTabSelected()) {
    this.selectAssigneesTab();
  }
};

IterationController.prototype.openLogEffort = function() {
  var widget = new SpentEffortWidget(this.model);
};

/**
 * Creates a new story controller.
 */
IterationController.prototype.storyControllerFactory = function(view, model) {
  var storyController = new StoryController(model, view, this);
  this.addChildController("story", storyController);
  return storyController;
};

IterationController.prototype.paintStoryList = function() {
  this.storyListView = new DynamicTable(this, this.model, this.storyListConfig,
      this.parentView);
  this.storyListView.render();
};

IterationController.prototype.paintTaskList = function() {
  this.taskListView = new DynamicTable(this, this.model, this.taskListConfig,
      this.taskListElement);
  this.taskListView.render();
};
/**
 * Initialize and render the story list.
 */
IterationController.prototype.paint = function() {
  var me = this;
  ModelFactory.initializeFor(ModelFactory.initializeForTypes.iteration,
      this.id, function(model) {
        me.model = model;
        me.attachModelListener();
        me.paintIterationInfo();
        me.paintStoryList();
        me.paintTaskList();
      });
  this.assigneeContainer = new AssignmentContainer(this.id);
  this.assigneeListView = new DynamicTable(this, this.assigneeContainer, this.assigneeListConfiguration,
      this.assigmentListElement);
};

IterationController.prototype.selectAssigneesTab = function() {
  this.assigneeContainer.reload();
};

/**
 * Show all tasks lists.
 */
IterationController.prototype.showTasks = function() {
  this.callChildcontrollers("story", StoryController.prototype.showTasks);
};

/**
 * Hide all task lists.
 */
IterationController.prototype.hideTasks = function() {
  this.callChildcontrollers("story", StoryController.prototype.hideTasks);
};

/**
 * Populate a new, editable story row to the story table. 
 */
IterationController.prototype.createStory = function() {
  var mockModel = ModelFactory.createObject(ModelFactory.types.story);
  mockModel.setBacklog(this.model);
  var controller = new StoryController(mockModel, null, this);
  var row = this.storyListView.createRow(controller, mockModel, "top");
  controller.view = row;
  row.autoCreateCells([StoryController.columnIndices.priority, StoryController.columnIndices.actions, StoryController.columnIndices.tasksData]);
  row.render();
  controller.openRowEdit();
  row.getCell(StoryController.columnIndices.tasksData).hide();
};


IterationController.prototype.filterStoriesByState = function(element) {
  var me = this;
  var bub = new Bubble(element, {
    title: "Filter by state",
    offsetX: -15,
    minWidth: 100,
    minHeight: 20
  });
  var filterFunc = function(story) {
    return (!me.stateFilters || jQuery.inArray(story.getState(), me.stateFilters) !== -1);
  };
  
  var widget = new StateFilterWidget(bub.getElement(), {
   callback: function(isActive) {
      me.stateFilters = widget.getFilter();
      if(isActive) {
        me.storyListView.activateColumnFilter("State");
        me.storyListView.setFilter(filterFunc);
      } else {
        me.storyListView.disableColumnFilter("State");
        me.storyListView.setFilter(null);
      }
      me.storyListView.filter();
    },
    activeStates: me.stateFilters
  });
};

IterationController.prototype.initializeTaskListConfig = function() {
  var config = new DynamicTableConfiguration({
    rowControllerFactory: TasksWithoutStoryController.prototype.taskControllerFactory,
    dataSource: IterationModel.prototype.getTasks,
    dataType: "task",
    caption: "Tasks without story",
    captionConfig: {
      cssClasses: "dynamictable-caption-block ui-widget-header ui-corner-all"
    },
    cssClass: "dynamicTable-sortable-tasklist ui-widget-content ui-corner-all task-table tasksWithoutStory-table",
    sortCallback: TaskController.prototype.sortAndMoveTask,
    sortOptions: {
      items: "> .dynamicTableDataRow",
      handle: "." + DynamicTable.cssClasses.dragHandle,
      connectWith: ".dynamicTable-sortable-tasklist > .ui-sortable"
    },
    tableDroppable: true,
    dropOptions: {
      accepts: function(model) {
        return (model instanceof TaskModel);
      },
      callback: TaskController.prototype.moveTask
    }
  });
  
  config.addCaptionItem({
    name : "createTask",
    text : "Create task",
    cssClass : "create",
    callback : TasksWithoutStoryController.prototype.createTask
  });
  
  config.addColumnConfiguration(TaskController.columnIndices.prio, {
    minWidth : 24,
    autoScale : true,
    cssClass : 'task-row',
    title : "#",
    headerTooltip : 'Priority',
    sortCallback: DynamicsComparators.valueComparatorFactory(TaskModel.prototype.getRank),
    defaultSortColumn: true,
    subViewFactory: TaskController.prototype.toggleFactory
  });
  config.addColumnConfiguration(TaskController.columnIndices.name, {
    minWidth : 200,
    autoScale : true,
    cssClass : 'task-row',
    title : "Name",
    headerTooltip : 'Task name',
    get : TaskModel.prototype.getName,
    editable : true,
    dragHandle: true,
    edit : {
      editor : "Text",
      set : TaskModel.prototype.setName,
      required: true
    }
  });
  config.addColumnConfiguration(TaskController.columnIndices.state, {
    minWidth : 60,
    autoScale : true,
    cssClass : 'task-row',
    title : "State",
    headerTooltip : 'Task state',
    get : TaskModel.prototype.getState,
    decorator: DynamicsDecorators.stateColorDecorator,
    editable : true,
    edit : {
      editor : "Selection",
      set : TaskModel.prototype.setState,
      items : DynamicsDecorators.stateOptions
    }
  });
  config.addColumnConfiguration(TaskController.columnIndices.responsibles, {
    minWidth : 60,
    autoScale : true,
    cssClass : 'task-row',
    title : "Responsibles",
    headerTooltip : 'Task responsibles',
    get : TaskModel.prototype.getResponsibles,
    getView : TaskModel.prototype.getAnnotatedResponsibles,
    decorator: DynamicsDecorators.annotatedUserInitialsListDecorator,
    editable : true,
    openOnRowEdit: false,
    edit : {
      editor : "Autocomplete",
      dialogTitle: "Select users",
      dataType: "usersAndTeams",
      set : TaskModel.prototype.setResponsibles
    }
  });
  config.addColumnConfiguration(TaskController.columnIndices.el, {
    minWidth : 30,
    autoScale : true,
    cssClass : 'task-row',
    title : "EL",
    headerTooltip : 'Effort left',
    get : TaskModel.prototype.getEffortLeft,
    decorator: DynamicsDecorators.exactEstimateDecorator,
    editable : true,
    editableCallback: TaskController.prototype.effortLeftEditable,
    edit : {
      editor : "ExactEstimate",
      decorator: DynamicsDecorators.exactEstimateEditDecorator,
      set : TaskModel.prototype.setEffortLeft
    }
  });
  config.addColumnConfiguration(TaskController.columnIndices.oe, {
    minWidth : 30,
    autoScale : true,
    cssClass : 'task-row',
    title : "OE",
    headerTooltip : 'Original estimate',
    get : TaskModel.prototype.getOriginalEstimate,
    decorator: DynamicsDecorators.exactEstimateDecorator,
    editable : true,
    editableCallback: TaskController.prototype.originalEstimateEditable,
    edit : {
      editor : "ExactEstimate",
      decorator: DynamicsDecorators.exactEstimateEditDecorator,
      set : TaskModel.prototype.setOriginalEstimate
    }
  });
  if (Configuration.isTimesheetsEnabled()) {
    config.addColumnConfiguration(TaskController.columnIndices.es, {
      minWidth : 30,
      autoScale : true,
      cssClass : 'task-row',
      title : "ES",
      headerTooltip : 'Effort spent',
      get : TaskModel.prototype.getEffortSpent,
      decorator: DynamicsDecorators.exactEstimateDecorator,
      editable : false,
      onDoubleClick: TaskController.prototype.openQuickLogEffort,
      edit : {
        editor : "ExactEstimate",
        decorator: DynamicsDecorators.empty,
        set : TaskController.prototype.quickLogEffort
      }
    });
  }
  config.addColumnConfiguration(TaskController.columnIndices.actions, {
    minWidth : 33,
    autoScale : true,
    cssClass : 'task-row',
    title : "Edit",
    subViewFactory: TaskController.prototype.actionColumnFactory
  });
  config.addColumnConfiguration(TaskController.columnIndices.description, {
    fullWidth : true,
    get : TaskModel.prototype.getDescription,
    cssClass : 'task-data',
    visible : false,
    decorator: DynamicsDecorators.onEmptyDecoratorFactory("(Empty description)"),
    editable : true,
    edit : {
      editor : "Wysiwyg",
      set : TaskModel.prototype.setDescription
    }
  });
  config.addColumnConfiguration(TaskController.columnIndices.buttons, {
    fullWidth : true,
    visible : false,
    cssClass : 'task-row',
    subViewFactory : DynamicsButtons.commonButtonFactory
  });
  config.addColumnConfiguration(TaskController.columnIndices.data, {
    fullWidth : true,
    visible : false,
    cssClass : 'task-data',
    visible : false
  });
  
  this.taskListConfig = config;
};


/**
 * Initialize configuration for story lists.
 */
IterationController.prototype.initializeStoryConfig = function() {
  var config = new DynamicTableConfiguration( {
    rowControllerFactory : IterationController.prototype.storyControllerFactory,
    dataSource : IterationModel.prototype.getStories,
    sortCallback: StoryController.prototype.rankStory,
    caption : "Stories",
    dataType: "story",
    captionConfig: {
      cssClasses: "dynamictable-caption-block ui-widget-header ui-corner-all"
    },
    cssClass: "ui-widget-content ui-corner-all iteration-story-table",
    rowDroppable: true,
    dropOptions: {
      callback: TaskController.prototype.moveTask,
      accepts: StoryController.prototype.acceptsDraggable
    }
  });

  config.addCaptionItem( {
    name : "createStory",
    text : "Create story",
    cssClass : "create",
    callback : IterationController.prototype.createStory
  });

  config.addCaptionItem( {
    name : "showTasks",
    text : "Show tasks",
    connectWith : "hideTasks",
    cssClass : "hide",
    visible: true,
    callback : IterationController.prototype.showTasks
  });
  config.addCaptionItem( {
    name : "hideTasks",
    text : "Hide tasks",
    visible : false,
    connectWith : "showTasks",
    cssClass : "show",
    callback : IterationController.prototype.hideTasks
  });

  config.addColumnConfiguration(StoryController.columnIndices.priority, {
    minWidth : 24,
    autoScale : true,
    cssClass : 'story-row',
    title : "#",
    headerTooltip : 'Priority',
    /*get: StoryModel.prototype.getRank,*/
    sortCallback: DynamicsComparators.valueComparatorFactory(StoryModel.prototype.getRank),
    defaultSortColumn: true,
    subViewFactory : StoryController.prototype.taskToggleFactory
  });
  config.addColumnConfiguration(StoryController.columnIndices.name, {
    minWidth : 280,
    autoScale : true,
    cssClass : 'story-row',
    title : "Name",
    headerTooltip : 'Story name',
    get : StoryModel.prototype.getName,
    sortCallback: DynamicsComparators.valueComparatorFactory(StoryModel.prototype.getName),
    defaultSortColumn: true,
    editable : true,
    dragHandle: true,
    edit : {
      editor : "Text",
      set : StoryModel.prototype.setName,
      required: true
    }
  });
  config.addColumnConfiguration(StoryController.columnIndices.points, {
    minWidth : 50,
    autoScale : true,
    cssClass : 'story-row',
    title : "Points",
    headerTooltip : 'Estimate in story points',
    get : StoryModel.prototype.getStoryPoints,
    sortCallback: DynamicsComparators.valueComparatorFactory(StoryModel.prototype.getStoryPoints),
    decorator: DynamicsDecorators.estimateDecorator,
    editable : true,
    editableCallback: StoryController.prototype.storyPointsEditable,
    edit : {
      editor : "Estimate",
      set : StoryModel.prototype.setStoryPoints
    }
  });
  config.addColumnConfiguration(StoryController.columnIndices.state, {
    minWidth : 70,
    autoScale : true,
    cssClass : 'story-row',
    title : "State",
    headerTooltip : 'Story state',
    get : StoryModel.prototype.getState,
    decorator: DynamicsDecorators.stateColorDecorator,
    editable : true,
    filter: IterationController.prototype.filterStoriesByState,
    edit : {
      editor : "Selection",
      set : StoryModel.prototype.setState,
      items : DynamicsDecorators.stateOptions
    }
  });
  config.addColumnConfiguration(StoryController.columnIndices.responsibles, {
    minWidth : 60,
    autoScale : true,
    cssClass : 'story-row',
    title : "Responsibles",
    headerTooltip : 'Story responsibles',
    get : StoryModel.prototype.getResponsibles,
    decorator: DynamicsDecorators.userInitialsListDecorator,
    editable : true,
    openOnRowEdit: false,
    edit : {
      editor : "Autocomplete",
      dialogTitle: "Select users",
      dataType: "usersAndTeams",
      set : StoryModel.prototype.setResponsibles
    }
  });
  config.addColumnConfiguration(StoryController.columnIndices.el, {
    minWidth : 30,
    autoScale : true,
    cssClass : 'sum-column',
    title : "Σ(EL)",
    headerTooltip : "Total sum of stories' tasks' effort left estimates",
    decorator: DynamicsDecorators.exactEstimateSumDecorator,
    get : StoryModel.prototype.getTotalEffortLeft
  });
  config.addColumnConfiguration(StoryController.columnIndices.oe, {
    minWidth : 30,
    autoScale : true,
    cssClass : 'sum-column',
    title : "Σ(OE)",
    headerTooltip : 'Total task original estimate',
    decorator: DynamicsDecorators.exactEstimateSumDecorator,
    get : StoryModel.prototype.getTotalOriginalEstimate
  });
  if (Configuration.isTimesheetsEnabled()) {
    config.addColumnConfiguration(StoryController.columnIndices.es, {
      minWidth : 30,
      autoScale : true,
      cssClass : 'story-row',
      title : "ES",
      headerTooltip : 'Total task effort spent',
      decorator: DynamicsDecorators.exactEstimateDecorator,
      get : StoryModel.prototype.getTotalEffortSpent,
      editable : false,
      onDoubleClick: StoryController.prototype.openQuickLogEffort,
      edit : {
        editor : "ExactEstimate",
        decorator: DynamicsDecorators.empty,
        set : StoryController.prototype.quickLogEffort
      }
    });
  }
  config.addColumnConfiguration(StoryController.columnIndices.actions, {
    minWidth : 33,
    autoScale : true,
    cssClass : 'story-row',
    title : "Edit",
    subViewFactory : StoryController.prototype.storyActionFactory
  });
  config.addColumnConfiguration(StoryController.columnIndices.description, {
    fullWidth : true,
    visible : false,
    get : StoryModel.prototype.getDescription,
    decorator: DynamicsDecorators.onEmptyDecoratorFactory("(Empty description)"),
    editable : true,
    edit : {
      editor : "Wysiwyg",
      set : StoryModel.prototype.setDescription
    }
  });
  config.addColumnConfiguration(StoryController.columnIndices.buttons, {
    fullWidth : true,
    visible : false,
    cssClass : 'story-row',
    subViewFactory : DynamicsButtons.commonButtonFactory
  });
  config.addColumnConfiguration(StoryController.columnIndices.details, {
    fullWidth : true,
    visible : false,
    targetCell: StoryController.columnIndices.details,
    subViewFactory : StoryController.prototype.storyDetailsFactory,
    delayedRender: true
  });
  config.addColumnConfiguration(StoryController.columnIndices.tasksData, {
    fullWidth : true,
    visible : false,
    cssClass : 'story-task-container',
    targetCell: StoryController.columnIndices.tasksData,
    subViewFactory : StoryController.prototype.storyTaskListFactory,
    delayedRender: true
  });
  this.storyListConfig = config;
};




IterationController.prototype.initIterationInfoConfig = function() {
  var config = new DynamicTableConfiguration( {
    leftWidth: '20%',
    rightWidth: '79%',
    closeRowCallback: null,
    validators: [ BacklogModel.Validators.dateValidator ]
  });
  config.addColumnConfiguration(0, IterationController.columnConfigs.name);
  config.addColumnConfiguration(1, IterationController.columnConfigs.startDate);  
  config.addColumnConfiguration(2, IterationController.columnConfigs.endDate);
  config.addColumnConfiguration(3, IterationController.columnConfigs.plannedSize);
  config.addColumnConfiguration(4, IterationController.columnConfigs.baselineLoad);
  config.addColumnConfiguration(5, IterationController.columnConfigs.assignees);
  config.addColumnConfiguration(6, IterationController.columnConfigs.description);
  this.iterationDetailConfig = config;
};

IterationController.prototype.initAssigneeConfiguration = function() {
  var config = new DynamicTableConfiguration(
      {
        rowControllerFactory : BacklogController.prototype.assignmentControllerFactory,
        dataSource : AssignmentContainer.prototype.getAssignments,
        caption : "Iteration workload by user"
      }); 
  config.addColumnConfiguration(0, {
    minWidth : 150,
    autoScale : true,
    title : "User",
    get : AssignmentModel.prototype.getUser,
    decorator: DynamicsDecorators.conditionColorDecorator(
        AssignmentModel.prototype.isUnassigned, 
        function(v) { if(v) { return 'red'; } }, 
        DynamicsDecorators.userNameDecorator)
  });
  
  
  config.addColumnConfiguration(1, {
    minWidth : 100,
    autoScale : true,
    title : "Adjustment",
    get : AssignmentModel.prototype.getPersonalLoad,
    decorator: DynamicsDecorators.exactEstimateDecorator,
    editable: true,
    edit: {
      editor: "ExactEstimate",
      acceptNegative: true,
      set: AssignmentModel.prototype.setPersonalLoad,
      decorator: DynamicsDecorators.exactEstimateEditDecorator
    }
  });
  config.addColumnConfiguration(2, {
    minWidth : 80,
    autoScale : true,
    title : "Availability",
    get : AssignmentModel.prototype.getAvailability,
    decorator: DynamicsDecorators.appendDecoratorFactory("%"),
    editable: true,
    edit: {
      editor: "Number",
      minVal: 0,
      maxVal: 100,
      set: AssignmentModel.prototype.setAvailability
    }
  });
  config.addColumnConfiguration(3, {
    minWidth : 100,
    autoScale : true,
    title : "Assigned",
    get : AssignmentModel.prototype.getAssignedLoad,
    decorator: DynamicsDecorators.exactEstimateEditDecorator
  });
  config.addColumnConfiguration(4, {
    minWidth : 100,
    autoScale : true,
    title : "Unassigned",
    get : AssignmentModel.prototype.getUnassignedLoad,
    decorator: DynamicsDecorators.exactEstimateEditDecorator
  });
  config.addColumnConfiguration(5, {
    minWidth : 100,
    autoScale : true,
    title : "Total",
    get : AssignmentModel.prototype.getTotalLoad,
    decorator: DynamicsDecorators.exactEstimateEditDecorator,
    sortCallback: DynamicsComparators.valueComparatorFactory(AssignmentModel.prototype.getTotalLoad)
  });
  config.addColumnConfiguration(6, {
    minWidth : 100,
    autoScale : true,
    title : "Worktime",
    get : AssignmentModel.prototype.getAvailableWorktime,
    decorator: DynamicsDecorators.exactEstimateEditDecorator,
    sortCallback: DynamicsComparators.valueComparatorFactory(AssignmentModel.prototype.getAvailableWorktime)
  });
  config.addColumnConfiguration(7, {
    minWidth : 100,
    autoScale : true,
    title : "Load",
    get : AssignmentModel.prototype.getLoadPercentage,
    decorator: DynamicsDecorators.appendDecoratorFactory("%"),
    sortCallback: DynamicsComparators.valueComparatorFactory(AssignmentModel.prototype.getLoadPercentage)
  });
  this.assigneeListConfiguration = config;
};
