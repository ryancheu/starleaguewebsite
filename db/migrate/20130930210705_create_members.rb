class CreateMembers < ActiveRecord::Migration
  def self.up
    create_table :members do |t|
      t.string :kerberos
      t.string :username
      t.string :email
      t.string :race
      t.string :league

      t.timestamps
    end
  end

  def self.down
    drop_table :members
  end
end
