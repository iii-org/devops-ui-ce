function Project(project) {
  if (!project) {
    return
  }

  // Database columns
  this.id = project.id
  this.identifier = project.identifier
  this.display_name = project.display_name
  this.description = project.description
  this.is_disabled = project.is_disabled
  this.start_date = project.start_date
  this.due_date = project.due_date
  this.create_at = project.create_at
  this.update_at = project.update_at
  this.total_member = project.total_member
  this.is_starred = project.is_starred
  this.is_locked = project.is_locked
  this.lock_reason = project.lock_reason
  this.base_example = project.base_example
  this.parent_id = project.parent_id
  this.is_empty = project.is_empty
  this.is_inheritance_member = project.is_inheritance_member
  this.image_auto_del = project.image_auto_del

  this.creator_id = project.creator.id
  this.owner_id = project.owner.id
  this.owner_name = project.owner.full_name
  this.owner_department = project.owner.department

  this.redmine_url = project.redmine_url
  this.repository_id = project.repository_id
  this.harbor_url = project.harbor_url
  this.git_url = project.git_url
  this.ssh_url = project.ssh_url

  // PM project list fields
  this.issues = {
    closed: project.issue_count.closed,
    overdue: project.issue_count.overdue,
    total: project.issue_count.total
  }
  this.project_status = project.project_status

  // RD project list fields
  this.next_d_time = project.next_deadline
  this.last_test_time = project.last_test_time
  this.last_test_result = project.last_test_result

  // children project
  this.children = []
  this.has_children = project.has_children
}

export default Project
