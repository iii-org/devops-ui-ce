function User(user) {
  if (!user) {
    return
  }

  this.create_at = user.create_at
  this.department = user.department
  this.is_active = user.is_active
  this.is_superuser = user.is_superuser
  this.email = user.email
  this.can_modify = user.can_modify
  this.id = user.id
  this.username = user.username
  this.full_name = user.full_name
  this.first_name = user.first_name
  this.last_name = user.last_name
  this.phone = user.phone
  this.title = user.title
  this.update_at = user.update_at
  this.last_login = user.last_login
  this.organization_id = user.organization_id
  this.role = {
    id: user.role.id,
    name: user.role.name
  }
  if (user.role) {
    this.default_role_id = user.role.id
    this.default_role_name = user.role.name
  }
}

export default User
