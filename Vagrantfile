# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure("2") do |config|
    # Base box
    config.vm.box = "boxcutter/ubuntu1604"

    # Port forwardings
    config.vm.network "forwarded_port", guest: 80, host: 9001

    # Virtual machine details
    config.vm.provider "virtualbox" do |vb|
        vb.gui = false
        vb.memory = "1024"
        vb.name = "YBoard"
    end

    # Provisioning
    config.vm.provision "shell", path: "vagrant_provision.sh"
end
