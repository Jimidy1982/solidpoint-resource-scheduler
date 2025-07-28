# Project Grouping Guide

## Overview
The Resource Scheduler now supports project grouping, allowing you to create dependencies between projects so they move together when one is dragged.

## How to Use Project Grouping

### Creating Groups
1. **Select Projects**: Hold `Ctrl` and click on multiple projects to select them
2. **Create Group**: Press `Ctrl+G` to create a group from selected projects
3. **Visual Feedback**: You'll see a notification showing how many projects are selected

### Group Behavior
- **Visual Indicators**: Grouped projects have a dashed purple border and highlighted background
- **Movement**: When you drag any project in a group, all projects in that group move together
- **Resource Constraints**: 
  - If all projects in a group are on the same resource, the entire group can move to a different resource
  - If projects span multiple resources, the group can only move horizontally (timeline position) - each project stays on its original resource
- **Cross-Resource Grouping**: You can now group projects regardless of which resources they're assigned to

### Managing Groups

#### Adding Projects to Existing Groups
- Hold `Ctrl` and click on a project that's already in a group
- Then hold `Ctrl` and click on another project to add it to the same group

#### Removing Projects from Groups
- Hold `Shift` and click on a grouped project to remove it from the group
- The project becomes independent again

#### Ungrouping Projects
- Click the "U" button that appears on grouped projects when you hover over them
- This removes the project from its group

### Keyboard Shortcuts
- `Ctrl+Click`: Select/deselect projects for grouping
- `Shift+Click`: Remove project from current selection
- `Ctrl+G`: Create group from selected projects

### Visual Indicators
- **Selected for grouping**: Projects have a purple highlight
- **Grouped projects**: Projects have a dashed purple border and subtle background
- **Group action button**: Small "U" button appears on grouped projects for ungrouping

### Data Management
- Project groups are automatically saved to localStorage
- Use the Data Cleanup tool to view group statistics or clear all groups
- Groups are included in data exports

## Technical Notes
- Groups are stored separately from projects for better data management
- Group operations are integrated with the undo/redo system
- Groups maintain their relative timing when moved
- Empty groups are automatically cleaned up 