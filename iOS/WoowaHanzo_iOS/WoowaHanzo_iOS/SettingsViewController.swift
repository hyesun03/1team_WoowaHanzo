//
//  SettingsViewController.swift
//  WoowaHanzo_iOS
//
//  Created by woowabrothers on 2017. 8. 25..
//  Copyright © 2017년 woowabrothers_dain. All rights reserved.
//

import UIKit
import Firebase

class SettingsViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
self.navigationController?.navigationBar.tintColor = UIColor(red: 42/255, green: 193/255, blue: 188/255, alpha: 1)
        // Do any additional setup after loading the view.
    }

    @IBAction func logoutButtonTouched(_ sender: Any) {
        let firebaseAuth = Auth.auth()
        do {
            User.myUsers = Array<User>()
            //NotificationCenter.default.removeObserver(self, name:NSNotification.Name(rawValue: "LoadUserInfo2"), object:nil)

            try firebaseAuth.signOut()
            let storyboard = UIStoryboard(name: "MainLayout", bundle: nil)
            let controller = storyboard.instantiateViewController(withIdentifier: "mainLayout")
            self.present(controller, animated: false, completion: nil)
        } catch let signOutError as NSError {
            print ("Error signing out: %@", signOutError)
        }
    }
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
}
