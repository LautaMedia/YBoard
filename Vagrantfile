# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure(2) do |config|
    # Base box
    config.vm.box = "ubuntu/zesty64"

    # Port forwardings
    config.vm.network "forwarded_port", guest: 80, host: 9001, host_ip: "127.0.0.1"

    # Virtual machine details
    config.vm.provider "virtualbox" do |vb|
        vb.gui = false
        vb.cpus = 2
        vb.memory = 1024
        vb.name = "YBoard"
        vb.customize [ "modifyvm", :id, "--bioslogofadein", "off" ]
        vb.customize [ "modifyvm", :id, "--bioslogofadeout", "off" ]
        vb.customize [ "modifyvm", :id, "--bioslogodisplaytime", "0" ]
        #vb.customize [ "modifyvm", :id, "--uart1", "off" ]
        vb.customize [ "modifyvm", :id, "--uartmode1", "disconnected" ]
    end

    # Provisioning
    config.vm.provision "shell", path: "vagrant_provision.sh"
end
