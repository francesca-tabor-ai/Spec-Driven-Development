# Design Guidelines: Spec-Driven Development Workflow Application

## Design Approach

**Selected Approach**: Design System - Linear/VS Code Hybrid

This is a technical productivity tool requiring maximum clarity and efficiency. The design draws from Linear's minimalist precision, VS Code's editor-focused layout, and GitHub's document management patterns. Function over form - every element serves the workflow.

## Core Design Principles

1. **Information Hierarchy First**: Technical documents are primary - UI should fade into the background
2. **Scannable Structure**: Dense content requires clear visual organization
3. **Workspace Efficiency**: Multi-panel layouts for simultaneous viewing and editing
4. **Minimal Cognitive Load**: Reduce distractions, emphasize content

---

## Typography System

**Font Stack**:
- Primary: Inter (UI elements, headings)
- Monospace: JetBrains Mono (code, technical specs)

**Hierarchy**:
- Page Titles: text-2xl font-semibold (32px)
- Section Headers: text-xl font-medium (24px)
- Document Headers: text-lg font-medium (20px)
- Body Text: text-base (16px)
- Labels/Metadata: text-sm (14px)
- Captions: text-xs (12px)

**Technical Content**: Use monospace font for specification blocks, code snippets, variable names, and JSON-like structures

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, and 8** consistently
- Component padding: p-4, p-6
- Section spacing: space-y-6, gap-8
- Tight groupings: gap-2, space-y-2
- Generous sections: py-8, my-12

**Grid Structure**:
- Sidebar: fixed w-64 (256px)
- Main content: flex-1 with max-w-5xl for readability
- Multi-column where needed: grid-cols-2 on large screens, single column on mobile

---

## Application Layout

### Primary Structure

**Three-Panel Layout**:
1. **Left Sidebar** (fixed, w-64):
   - Navigation by agent type (Analyst, Architect, Developer)
   - Recent documents list
   - Constitution/standards access
   - Compact vertical navigation

2. **Main Content Area** (flex-1):
   - Document viewer/editor occupies full height
   - Sticky header with document title and metadata
   - Scrollable content area with proper max-width for reading

3. **Right Panel** (optional, w-80, collapsible):
   - Context variables editor
   - Agent configuration
   - Workflow status/progress

### Document Viewer

**Layout**:
- Full-height container with internal scroll
- Content max-w-4xl centered for optimal reading
- Generous padding: px-8 py-6

**Document Header**:
- Title + metadata bar (sticky top-0)
- Action buttons (Edit, Export, Archive)
- Breadcrumb navigation
- Clear visual separation with border-b

**Content Sections**:
- Clear section headers with space-y-8 between major sections
- Subsections use space-y-4
- Code/spec blocks: bg-gray-50 p-4 rounded-lg font-mono

---

## Component Library

### Navigation (Sidebar)

**Structure**:
- Vertical stack with space-y-1
- Section headers: text-xs uppercase tracking-wide
- Nav items: px-3 py-2 rounded-md
- Active state: clear visual indicator
- Icons: 20px from Heroicons (outline style)

### Buttons

**Sizes**:
- Primary: px-4 py-2 rounded-lg text-sm font-medium
- Secondary: px-3 py-1.5 rounded-md text-sm
- Icon-only: p-2 rounded-md

**Hierarchy**:
- Primary actions: solid fill
- Secondary: border with transparent bg
- Tertiary: transparent with hover state

### Forms & Inputs

**Text Inputs**:
- Height: h-10 (40px)
- Padding: px-3
- Border: border rounded-md
- Focus: ring-2 ring-offset-1

**Textareas** (for context variables):
- Min height: min-h-24
- Monospace font for technical input
- Resize-y for flexibility

**Selects/Dropdowns**:
- Same height as text inputs (h-10)
- Chevron icon indicator

### Document Components

**Specification Block**:
- Container: border rounded-lg p-6
- Header: flex justify-between items-start mb-4
- Content: prose prose-sm (Typography plugin)
- Metadata footer: text-xs with timestamp/author

**Agent Output Card**:
- Clear agent identification header (icon + name)
- Timestamp and status badge
- Content area with proper spacing
- Collapsible sections for long outputs

**Workflow Progress**:
- Horizontal step indicator
- Current step highlighted
- Completed steps: check icon
- Pending steps: dimmed

### Data Display

**Tables** (for requirement lists):
- Border collapse with subtle borders
- Alternating row treatment for scanability
- Fixed header on scroll
- Compact: py-2 px-3 cell padding

**Code Blocks**:
- font-mono text-sm
- Background: subtle gray
- Padding: p-4
- Rounded corners: rounded-lg
- Optional line numbers in gutter

---

## Interaction Patterns

**Modal Dialogs**:
- Overlay: semi-transparent backdrop
- Content: max-w-2xl centered, rounded-xl, p-6
- Header, body, footer structure
- Close button: top-right corner

**Toast Notifications**:
- Fixed bottom-right positioning
- Max-w-sm
- Auto-dismiss after 5 seconds
- Status-based icons (success, error, info)

**Loading States**:
- Skeleton screens for document loading
- Spinner for actions in progress
- Progress bar for multi-step workflows

---

## Specialized Features

### Constitution Editor

**Layout**: Full-height split view
- Left: Table of contents (w-64)
- Right: Editor (flex-1, max-w-4xl)
- Markdown preview toggle

### Agent Configuration

**Form Structure**:
- Grouped sections with space-y-6
- Context variable inputs with labels and descriptions
- Inline help text: text-sm text-gray-600
- Real-time validation feedback

### Workflow Execution View

**Timeline Layout**:
- Vertical timeline down center
- Agent outputs as cards attached to timeline
- Expandable/collapsible sections
- Clear visual flow from Requirements → Spec → Architecture

---

## Responsive Behavior

**Mobile (< 768px)**:
- Sidebar collapses to hamburger menu
- Single column layout
- Sticky header with navigation toggle
- Bottom sheet for context variables

**Tablet (768px - 1024px)**:
- Collapsible sidebar
- Main content full width when sidebar closed
- Optional right panel hidden by default

**Desktop (> 1024px)**:
- Full three-panel layout
- Comfortable spacing and sizing
- Multi-column grids where appropriate

---

## Accessibility

- Semantic HTML throughout
- ARIA labels for icon-only buttons
- Keyboard navigation (Tab, Escape, Enter)
- Focus indicators: ring-2 ring-blue-500
- Skip navigation links
- Proper heading hierarchy

---

## Animation Guidelines

**Minimal and Purposeful**:
- Sidebar collapse/expand: transition-all duration-200
- Modal entrance: fade-in with slight scale (duration-150)
- Loading spinners: animate-spin
- **No scroll animations, parallax, or decorative effects**

---

This design prioritizes clarity, efficiency, and technical precision. The interface should feel like a professional developer tool - clean, fast, and focused on content over decoration.