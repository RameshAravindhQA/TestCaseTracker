
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-medium">Manage Labels</h3>
    <Button onClick={() => setShowAddLabel(true)} size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Add Label
    </Button>
  </div>

  {/* Existing Labels */}
  <div className="space-y-2 max-h-48 overflow-y-auto">
    {labels.map((label) => (
      <div key={label.id} className="flex items-center justify-between p-2 border rounded">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: label.color }}
          />
          <span className="text-sm font-medium">{label.name}</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditLabel(label)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteLabel(label.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    ))}
    {labels.length === 0 && (
      <p className="text-sm text-muted-foreground text-center py-4">
        No labels created yet. Add your first label!
      </p>
    )}
  </div>

  {/* Add/Edit Label Form */}
  {(showAddLabel || editingLabel) && (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="label-name">Label Name</Label>
            <Input
              id="label-name"
              value={labelForm.name}
              onChange={(e) => setLabelForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter label name"
            />
          </div>
          
          <div>
            <Label htmlFor="label-color">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="label-color"
                type="color"
                value={labelForm.color}
                onChange={(e) => setLabelForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-8"
              />
              <Input
                value={labelForm.color}
                onChange={(e) => setLabelForm(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#000000"
                className="font-mono"
              />
              <div
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: labelForm.color }}
              />
            </div>
          </div>

          {/* Predefined Colors */}
          <div>
            <Label>Quick Colors</Label>
            <div className="flex gap-1 mt-1">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setLabelForm(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveLabel} size="sm">
              {editingLabel ? 'Update' : 'Create'} Label
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddLabel(false);
                setEditingLabel(null);
                setLabelForm({ name: '', color: '#3b82f6' });
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )}
</div>
