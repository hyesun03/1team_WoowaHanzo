//
//  TagListView2.swift
//  WoowaHanzo_iOS
//
//  Created by woowabrothers on 2017. 8. 22..
//  Copyright © 2017년 woowabrothers_dain. All rights reserved.
//

import Foundation
import UIKit
class TagPageView2: UIScrollView
{
    var numberOfRows = 0
    var currentRow = 0
    var tags = [UILabel]()
    var containerView:UIView!
    
    var hashtagsOffset:UIEdgeInsets = UIEdgeInsets(top: 2, left: 10, bottom: 0, right: 0)
    var rowHeight:CGFloat = 22 //height of rows
    var tagHorizontalPadding:CGFloat = 3.0 // padding between tags horizontally
    var tagVerticalPadding:CGFloat = 3.0 // padding between tags vertically
    var tagCombinedMargin:CGFloat = 0 // margin of left and right combined, text in tags are by default centered.
    override init(frame:CGRect)
    {
        super.init(frame: frame)
        numberOfRows = Int(frame.height / rowHeight)
        containerView = UIView(frame: self.frame)
        self.addSubview(containerView)
        self.showsVerticalScrollIndicator = false
        self.isScrollEnabled = false
    }
    
    override func awakeFromNib() {
        numberOfRows = Int(self.frame.height / rowHeight)
        containerView = UIView(frame: self.frame)
        self.addSubview(containerView)
        self.showsVerticalScrollIndicator = false
        self.isScrollEnabled = false
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        self.layoutTagsFromIndex(index: 0)
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    func addTag(text:String, target:AnyObject, backgroundColor:UIColor,textColor:UIColor)
    {
        //instantiate label
        //you can customize your label here! but make sure everything fit. Default row height is 30.
        let label = UILabel()
        label.clipsToBounds = true
        label.backgroundColor = backgroundColor
        label.text = text
        label.font = UIFont(name: "NotoSans-Bold", size: 16.0)!
        label.textColor = UIColor.black
        label.sizeToFit()
        label.textAlignment = NSTextAlignment.center
        //label.layer.cornerRadius = 10
        //label.layer.borderColor = UIColor(red: 52/255, green: 152/255, blue: 219/255, alpha: 1.0).cgColor
        //label.layer.borderWidth = 1.5
        let tapGesture = UITapGestureRecognizer(target: target, action: #selector(UserListView.handleTap))
        label.addGestureRecognizer(tapGesture)
        label.isUserInteractionEnabled = true
        self.tags.append(label)
        
        //calculate frame
        label.frame = CGRect(x: label.frame.origin.x, y: label.frame.origin.y , width: label.frame.width + tagCombinedMargin, height: rowHeight - tagVerticalPadding)
        if self.tags.count == 0
        {
            label.frame = CGRect(x: hashtagsOffset.left, y: hashtagsOffset.top, width: label.frame.width, height: label.frame.height)
            self.addSubview(label)
        }
        else
        {
            label.frame = self.generateFrameAtIndex(index: tags.count-1, rowNumber: &currentRow)
            self.addSubview(label)
        }
    }
    
    
    
    private func isOutofBounds(newPoint:CGPoint,labelFrame:CGRect)
    {
        let bottomYLimit = newPoint.y + labelFrame.height
        if bottomYLimit > self.contentSize.height
        {
            self.containerView.frame = CGRect(x: self.containerView.frame.origin.x, y: self.containerView.frame.origin.y, width: self.containerView.frame.width, height: self.containerView.frame.height + rowHeight - tagVerticalPadding)
            self.contentSize = CGSize(width: self.contentSize.width, height: self.contentSize.height + rowHeight - tagVerticalPadding)
        }
    }
    
    func getNextPosition() -> CGPoint
    {
        return getPositionForIndex(index: tags.count-1, rowNumber: self.currentRow)
    }
    
    func getPositionForIndex(index:Int,rowNumber:Int) -> CGPoint
    {
        if index == 0
        {
            return CGPoint(x: hashtagsOffset.left, y: hashtagsOffset.top)
        }
        let y = CGFloat(rowNumber) * self.rowHeight + hashtagsOffset.top
        let lastTagFrame = tags[index-1].frame
        let x = lastTagFrame.origin.x + lastTagFrame.width + tagHorizontalPadding
        return CGPoint(x: x, y: y)
    }
    
    func reset()
    {
        for tag in tags
        {
            tag.removeFromSuperview()
        }
        tags = []
        currentRow = 0
        numberOfRows = 0
    }
    
    func removeTagWithName(name:String)
    {
        for (index,tag) in tags.enumerated()
        {
            if tag.text! == name
            {
                removeTagWithIndex(index: index)
            }
        }
    }
    
    func removeTagWithIndex(index:Int)
    {
        if index > tags.count - 1
        {
            print("ERROR: Tag Index \(index) Out of Bounds")
            return
        }
        tags[index].removeFromSuperview()
        tags.remove(at: index)
        layoutTagsFromIndex(index: index)
    }
    
    private func getRowNumber(index:Int) -> Int
    {
        return Int((tags[index].frame.origin.y - hashtagsOffset.top)/rowHeight)
    }
    
    private func layoutTagsFromIndex(index:Int,animated:Bool = true)
    {
        if tags.count == 0
        {
            return
        }
        let animation:()->() =
        {
            var rowNumber = self.getRowNumber(index: index)
            for i in index...self.tags.count - 1
            {
                self.tags[i].frame = self.generateFrameAtIndex(index: i, rowNumber: &rowNumber)
            }
        }
        UIView.animate(withDuration: 0.3, animations: animation)
    }
    
    private func generateFrameAtIndex(index:Int, rowNumber: inout Int) -> CGRect
    {
        var newPoint = self.getPositionForIndex(index: index, rowNumber: rowNumber)
        if (newPoint.x + self.tags[index].frame.width) >= self.frame.width
        {
            rowNumber += 1
            newPoint = CGPoint(x: self.hashtagsOffset.left, y: CGFloat(rowNumber) * rowHeight + self.hashtagsOffset.top)
        }
        self.isOutofBounds(newPoint: newPoint,labelFrame: self.tags[index].frame)
        return CGRect(x: newPoint.x, y: newPoint.y, width: self.tags[index].frame.width, height: self.tags[index].frame.height)
    }
    
    func removeMultipleTagsWithIndices(indexSet:Set<Int>)
    {
        let sortedArray = Array(indexSet).sorted()
        for index in sortedArray
        {
            if index > tags.count - 1
            {
                print("ERROR: Tag Index \(index) Out of Bounds")
                continue
            }
            tags[index].removeFromSuperview()
            tags.remove(at: index)
        }
        layoutTagsFromIndex(index: sortedArray.first!)
    }
    
}
