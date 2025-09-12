<nav className="space-y-2">
        <SidebarItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          to="/dashboard"
          isActive={location.pathname === '/dashboard'}
        />

        <SidebarItem
          icon={<Folder className="h-5 w-5" />}
          label="Projects"
          to="/projects"
          isActive={location.pathname.startsWith('/projects')}
        />

        <SidebarItem
          icon={<FileText className="h-5 w-5" />}
          label="Test Cases"
          to="/test-cases"
          isActive={location.pathname.startsWith('/test-cases')}
        />

        <SidebarItem
          icon={<Bug className="h-5 w-5" />}
          label="Bug Reports"
          to="/bugs"
          isActive={location.pathname.startsWith('/bugs')}
        />

        <SidebarItem
          icon={<MessageSquare className="h-5 w-5" />}
          label="Messenger"
          to="/messenger"
          isActive={location.pathname.startsWith('/messenger')}
        />

        <SidebarItem
          icon={<Clock className="h-5 w-5" />}
          label="Timesheets"
          to="/timesheets"
          isActive={location.pathname.startsWith('/timesheets')}
        />

        <SidebarItem
          icon={<FileText className="h-5 w-5" />}
          label="Documents"
          to="/documents"
          isActive={location.pathname.startsWith('/documents')}
        />

        {/* Hide Reports and Traceability Matrix when on timesheets route */}
        {!location.pathname.startsWith('/timesheets') && (
          <>
            <SidebarItem
              icon={<BarChart3 className="h-5 w-5" />}
              label="Reports"
              to="/reports"
              isActive={location.pathname.startsWith('/reports')}
            />

            <SidebarItem
              icon={<Grid3X3 className="h-5 w-5" />}
              label="Traceability Matrix"
              to="/traceability-matrix"
              isActive={location.pathname.startsWith('/traceability-matrix')}
            />
          </>
        )}

        <SidebarItem
          icon={<Kanban className="h-5 w-5" />}
          label="Kanban Board"
          to="/kanban"
          isActive={location.pathname.startsWith('/kanban')}
        />

        <SidebarItem
          icon={<BookOpen className="h-5 w-5" />}
          label="Notebooks"
          to="/notebooks"
          isActive={location.pathname.startsWith('/notebooks')}
        />

        <SidebarItem
          icon={<TestTube className="h-5 w-5" />}
          label="Test Sheets"
          to="/test-sheets"
          isActive={location.pathname.startsWith('/test-sheets')}
        />

        <SidebarItem
          icon={<GitBranch className="h-5 w-5" />}
          label="GitHub Integration"
          to="/github"
          isActive={location.pathname.startsWith('/github')}
        />

        <SidebarItem
          icon={<Workflow className="h-5 w-5" />}
          label="Functional Flow"
          to="/functional-flow"
          isActive={location.pathname.startsWith('/functional-flow')}
        />

        <SidebarItem
          icon={<CheckSquare className="h-5 w-5" />}
          label="Todos"
          to="/todos"
          isActive={location.pathname.startsWith('/todos')}
        />

        <SidebarItem
          icon={<Users className="h-5 w-5" />}
          label="Users"
          to="/users"
          isActive={location.pathname.startsWith('/users')}
        />

        <SidebarItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          to="/settings"
          isActive={location.pathname.startsWith('/settings')}
        />
      </nav>