/*
 * scheduler.js - Interactive Scheduler and Calendar Application
 * Author: Bocaletto Luca
 * License: GPL v3
 *
 * Description:
 *   This script implements an interactive scheduler and calendar with multiple views
 *   (annual, monthly, weekly, and daily). It allows users to create, edit, and delete events.
 *   The application supports file operations ("Save" and "Load") for data persistence,
 *   and automatically saves events in localStorage so that data are restored after a refresh.
 *
 *   In addition, a header area displays the current period (month/year, week range, full date, or year)
 *   with navigation arrows to move to the previous or next period.
 *
 *   The code is modular, using an ES6 class (SchedulerCalendar) to encapsulate all functionality.
 */

class SchedulerCalendar {
  constructor(displayElementId) {
    this.displayElement = document.getElementById(displayElementId);
    if (!this.displayElement) {
      throw new Error(`Display element with ID "${displayElementId}" not found.`);
    }
    this.events = []; // Array of event objects: { id, title, date, time, description }
    this.currentView = 'monthly'; // Default view
    this.currentDate = new Date();
    this.init();
  }
  
  /**
   * Initialize calendar: load saved events from localStorage, render the default view,
   * bind UI controls and set up the view header.
   */
  init() {
    this.loadEventsLocal();
    this.renderCalendar();
    this.bindViewControls();
    this.bindEventForm();
    this.bindFileMenu();
  }
  
  /**
   * Save events array into localStorage.
   */
  saveEventsLocal() {
    localStorage.setItem("schedulerEvents", JSON.stringify(this.events));
  }
  
  /**
   * Load events array from localStorage.
   */
  loadEventsLocal() {
    const stored = localStorage.getItem("schedulerEvents");
    if (stored) {
      try {
        this.events = JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored events:", e);
        this.events = [];
      }
    }
  }
  
  /**
   * Binds the view control buttons for changing calendar views.
   */
  bindViewControls() {
    document.getElementById('annualView').addEventListener('click', () => {
      this.currentView = 'annual';
      this.renderCalendar();
    });
    document.getElementById('monthlyView').addEventListener('click', () => {
      this.currentView = 'monthly';
      this.renderCalendar();
    });
    document.getElementById('weeklyView').addEventListener('click', () => {
      this.currentView = 'weekly';
      this.renderCalendar();
    });
    document.getElementById('dailyView').addEventListener('click', () => {
      this.currentView = 'daily';
      this.renderCalendar();
    });
  }
  
  /**
   * Binds the event form submission and delete button.
   */
  bindEventForm() {
    const eventForm = document.getElementById('eventForm');
    const deleteBtn = document.getElementById('deleteEvent');
    
    eventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const eventData = {
        id: document.getElementById('eventId').value,
        title: document.getElementById('eventTitle').value.trim(),
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        description: document.getElementById('eventDescription').value.trim()
      };
      
      if (!eventData.title || !eventData.date) {
        alert("Title and Date are required!");
        return;
      }
      
      if (eventData.id) {
        // Edit existing event
        this.events = this.events.map(ev => ev.id === eventData.id ? eventData : ev);
      } else {
        // Create new event with a unique ID
        eventData.id = Date.now().toString();
        this.events.push(eventData);
      }
      
      this.saveEventsLocal();
      this.renderCalendar();
      eventForm.reset();
      deleteBtn.classList.add('d-none');
      bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
    });
    
    deleteBtn.addEventListener('click', () => {
      const eventId = document.getElementById('eventId').value;
      if (eventId) {
        this.events = this.events.filter(ev => ev.id !== eventId);
        this.saveEventsLocal();
        this.renderCalendar();
        document.getElementById('eventForm').reset();
        deleteBtn.classList.add('d-none');
        bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
      }
    });
  }
  
  /**
   * Binds File menu events for saving and loading from external files.
   */
  bindFileMenu() {
    document.getElementById('saveData').addEventListener('click', () => this.saveEventsFile());
    document.getElementById('loadData').addEventListener('click', () => this.openLoadDialog());
    
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => this.loadEventsFromFile(e));
  }
  
  /**
   * Renders the calendar based on the current view and updates the header.
   */
  renderCalendar() {
    this.displayElement.innerHTML = '';
    switch (this.currentView) {
      case 'monthly':
        this.renderMonthlyView();
        break;
      case 'weekly':
        this.renderWeeklyView();
        break;
      case 'daily':
        this.renderDailyView();
        break;
      case 'annual':
        this.renderAnnualView();
        break;
      default:
        this.renderMonthlyView();
    }
    this.updateViewHeader();
  }
  
  /**
   * Updates the view header with the current period title and binds arrow navigation.
   */
  updateViewHeader() {
    const periodTitleElem = document.getElementById("periodTitle");
    const prevPeriodElem = document.getElementById("prevPeriod");
    const nextPeriodElem = document.getElementById("nextPeriod");
    
    let title = "";
    
    switch (this.currentView) {
      case 'monthly':
        title = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        break;
      case 'weekly':
        {
          const current = new Date(this.currentDate);
          const startOfWeek = new Date(current);
          startOfWeek.setDate(current.getDate() - current.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          title = "Week: " + startOfWeek.toLocaleDateString() + " - " + endOfWeek.toLocaleDateString();
        }
        break;
      case 'daily':
        title = this.currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        break;
      case 'annual':
        title = this.currentDate.getFullYear().toString();
        break;
      default:
        title = "";
    }
    
    periodTitleElem.textContent = title;
    
    // Bind arrow events
    prevPeriodElem.onclick = () => this.previousPeriod();
    nextPeriodElem.onclick = () => this.nextPeriod();
  }
  
  /**
   * Moves the currentDate to the previous period based on the current view and re-renders the calendar.
   */
  previousPeriod() {
    switch (this.currentView) {
      case 'monthly':
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        break;
      case 'weekly':
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        break;
      case 'daily':
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        break;
      case 'annual':
        this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
        break;
    }
    this.renderCalendar();
  }
  
  /**
   * Moves the currentDate to the next period based on the current view and re-renders the calendar.
   */
  nextPeriod() {
    switch (this.currentView) {
      case 'monthly':
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        break;
      case 'weekly':
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        break;
      case 'daily':
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        break;
      case 'annual':
        this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
        break;
    }
    this.renderCalendar();
  }
  
  /**
   * Renders a monthly calendar view.
   */
  renderMonthlyView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Render header row for days of the week
    const headerRow = document.createElement('div');
    headerRow.classList.add('calendar');
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeek.forEach(day => {
      const headerCell = document.createElement('div');
      headerCell.classList.add('header-day');
      headerCell.textContent = day;
      headerRow.appendChild(headerCell);
    });
    this.displayElement.appendChild(headerRow);
    
    // Create grid for days
    const monthGrid = document.createElement('div');
    monthGrid.classList.add('calendar');
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Blank cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      const blankCell = document.createElement('div');
      blankCell.classList.add('calendar-day');
      monthGrid.appendChild(blankCell);
    }
    
    // Populate days with events
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.classList.add('calendar-day');
      
      const dayNum = document.createElement('div');
      dayNum.textContent = day;
      dayNum.style.fontWeight = "bold";
      dayCell.appendChild(dayNum);
      
      const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const eventList = document.createElement('ul');
      eventList.classList.add('list-unstyled');
      this.events.filter(ev => ev.date === dayString)
        .forEach(ev => {
          const li = document.createElement('li');
          li.classList.add('event-item');
          li.textContent = ev.title;
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openEditEvent(ev);
          });
          eventList.appendChild(li);
        });
      dayCell.appendChild(eventList);
      
      dayCell.addEventListener('click', () => {
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = "";
        document.getElementById('eventDate').value = dayString;
        document.getElementById('deleteEvent').classList.add('d-none');
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        modal.show();
      });
      
      monthGrid.appendChild(dayCell);
    }
    
    this.displayElement.appendChild(monthGrid);
  }
  
  /**
   * Renders a weekly calendar view.
   */
  renderWeeklyView() {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
    
    const weekContainer = document.createElement('div');
    weekContainer.classList.add('d-flex', 'justify-content-between');
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dayString = `${dayDate.getFullYear()}-${String(dayDate.getMonth()+1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      
      const dayDiv = document.createElement('div');
      dayDiv.classList.add('border', 'p-2', 'flex-fill', 'mx-1');
      dayDiv.style.minHeight = "150px";
      
      const header = document.createElement('h6');
      header.textContent = dayString;
      dayDiv.appendChild(header);
      
      const eventsForDay = this.events.filter(ev => ev.date === dayString);
      if (eventsForDay.length > 0) {
        const ul = document.createElement('ul');
        ul.classList.add('list-unstyled');
        eventsForDay.forEach(ev => {
          const li = document.createElement('li');
          li.classList.add('event-item');
          li.textContent = ev.title;
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openEditEvent(ev);
          });
          ul.appendChild(li);
        });
        dayDiv.appendChild(ul);
      }
      
      dayDiv.addEventListener('click', () => {
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = "";
        document.getElementById('eventDate').value = dayString;
        document.getElementById('deleteEvent').classList.add('d-none');
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        modal.show();
      });
      
      weekContainer.appendChild(dayDiv);
    }
    
    this.displayElement.appendChild(weekContainer);
  }
  
  /**
   * Renders a daily view.
   */
  renderDailyView() {
    const dayString = `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth()+1).padStart(2, '0')}-${String(this.currentDate.getDate()).padStart(2, '0')}`;
    const header = document.createElement('h5');
    header.textContent = `Events for ${dayString}`;
    this.displayElement.appendChild(header);
    
    const eventsForDay = this.events.filter(ev => ev.date === dayString);
    if (eventsForDay.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.textContent = "No events for this day.";
      this.displayElement.appendChild(placeholder);
    } else {
      const listGroup = document.createElement('div');
      listGroup.classList.add('list-group');
      eventsForDay.forEach(ev => {
        const item = document.createElement('button');
        item.classList.add('list-group-item', 'list-group-item-action');
        item.textContent = `${ev.time ? ev.time + ' - ' : ''}${ev.title}`;
        item.addEventListener('click', () => this.openEditEvent(ev));
        listGroup.appendChild(item);
      });
      this.displayElement.appendChild(listGroup);
    }
  }
  
  /**
   * Renders an annual view by displaying 12 mini calendars in a 3x4 grid.
   */
  renderAnnualView() {
    const year = this.currentDate.getFullYear();
    const container = document.createElement('div');
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(3, 1fr)";
    container.style.gap = "10px";
    
    for (let m = 0; m < 12; m++) {
      const monthDiv = document.createElement("div");
      monthDiv.classList.add("mini-calendar");
      monthDiv.style.border = "1px solid #ccc";
      monthDiv.style.padding = "5px";
      monthDiv.style.borderRadius = "4px";
      
      // Month header
      const monthName = new Date(year, m).toLocaleString('default', { month: 'long' });
      const header = document.createElement("h6");
      header.textContent = monthName;
      header.style.textAlign = "center";
      header.style.marginBottom = "5px";
      monthDiv.appendChild(header);
      
      // Create mini calendar grid (header row with days initials)
      const miniCalendar = document.createElement("div");
      miniCalendar.style.display = "grid";
      miniCalendar.style.gridTemplateColumns = "repeat(7, 1fr)";
      miniCalendar.style.gap = "1px";
      miniCalendar.style.backgroundColor = "#ddd";
      const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
      daysOfWeek.forEach(day => {
        const cell = document.createElement("div");
        cell.classList.add("header-day");
        cell.textContent = day;
        cell.style.fontSize = "0.6rem";
        cell.style.padding = "1px";
        cell.style.textAlign = "center";
        miniCalendar.appendChild(cell);
      });
      
      // Blank cells for days before month start
      const firstDay = new Date(year, m, 1).getDay();
      for (let i = 0; i < firstDay; i++){
        const blank = document.createElement("div");
        blank.classList.add("calendar-day");
        blank.style.minHeight = "10px";
        blank.style.padding = "1px";
        miniCalendar.appendChild(blank);
      }
      
      // Days of month
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++){
        const cell = document.createElement("div");
        cell.classList.add("calendar-day");
        cell.style.minHeight = "10px";
        cell.style.padding = "1px";
        cell.style.fontSize = "0.6rem";
        cell.style.textAlign = "center";
        cell.textContent = day;
        
        const dayString = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const eventsForDay = this.events.filter(ev => ev.date === dayString);
        if (eventsForDay.length > 0) {
          const dot = document.createElement("div");
          dot.style.width = "5px";
          dot.style.height = "5px";
          dot.style.backgroundColor = "red";
          dot.style.borderRadius = "50%";
          dot.style.margin = "2px auto 0";
          cell.appendChild(dot);
        }
        
        cell.addEventListener("click", () => {
          this.currentDate = new Date(year, m, day);
          this.currentView = 'daily';
          this.renderCalendar();
        });
        
        miniCalendar.appendChild(cell);
      }
      
      monthDiv.appendChild(miniCalendar);
      container.appendChild(monthDiv);
    }
    
    this.displayElement.appendChild(container);
  }
  
  /**
   * Opens the modal in edit mode with pre-filled event data.
   * @param {Object} evObj - The event object to edit.
   */
  openEditEvent(evObj) {
    document.getElementById('eventId').value = evObj.id;
    document.getElementById('eventTitle').value = evObj.title;
    document.getElementById('eventDate').value = evObj.date;
    document.getElementById('eventTime').value = evObj.time;
    document.getElementById('eventDescription').value = evObj.description;
    document.getElementById('deleteEvent').classList.remove('d-none');
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    modal.show();
  }
  
  /**
   * Saves current events to a JSON file.
   */
  saveEventsFile() {
    const dataStr = JSON.stringify(this.events, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scheduler-events.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Opens the file input dialog for loading events.
   */
  openLoadDialog() {
    document.getElementById('fileInput').click();
  }
  
  /**
   * Loads events from a selected JSON file.
   * @param {Event} event - The change event from the file input.
   */
  loadEventsFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedEvents = JSON.parse(e.target.result);
        if (Array.isArray(loadedEvents)) {
          this.events = loadedEvents;
          this.saveEventsLocal();
          this.renderCalendar();
        } else {
          alert("Invalid event data in file.");
        }
      } catch (error) {
        alert("Error reading file: " + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }
}

// Function to update the current date/time in the navbar
function updateCurrentDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString();
  const currentDateTimeElem = document.getElementById("currentDateTime");
  if (currentDateTimeElem) {
    currentDateTimeElem.textContent = formatted;
  }
}
setInterval(updateCurrentDateTime, 1000);
updateCurrentDateTime();

// Initialize SchedulerCalendar when DOM content is loaded.
document.addEventListener('DOMContentLoaded', () => {
  try {
    new SchedulerCalendar('calendarDisplay');
  } catch (error) {
    console.error("Error initializing SchedulerCalendar:", error);
  }
});
