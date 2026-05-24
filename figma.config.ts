/**
 * PARSPEL Figma Code Connect Configuration
 *
 * Bu dosya Figma bileşenlerini React koduna bağlar.
 * Figma'daki tasarımlar otomatik olarak kod örnekleriyle eşleşir.
 *
 * Kurulum:
 * 1. npm install @figma/code-connect
 * 2. figma connect publish
 */

import { figmaConnect } from "@figma/code-connect";

// ─────────────────────────────────────────────────────────────────────────
// BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Button",
  ({ variant = "default", size = "default", children, disabled }) => (
    `<Button variant="${variant}" size="${size}" disabled={${disabled}}>
      ${children}
    </Button>`
  ),
  {
    props: {
      variant: figmaConnect.enum("variant", {
        default: "default",
        destructive: "destructive",
        outline: "outline",
        secondary: "secondary",
        ghost: "ghost",
        link: "link",
      }),
      size: figmaConnect.enum("size", {
        sm: "sm",
        default: "default",
        lg: "lg",
        icon: "icon",
      }),
      disabled: figmaConnect.boolean("disabled"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// INPUT COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Input",
  ({ placeholder, disabled, type = "text" }) => (
    `<Input
      type="${type}"
      placeholder="${placeholder}"
      disabled={${disabled}}
    />`
  ),
  {
    props: {
      placeholder: figmaConnect.string("placeholder"),
      disabled: figmaConnect.boolean("disabled"),
      type: figmaConnect.enum("type", {
        text: "text",
        email: "email",
        password: "password",
        number: "number",
      }),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Card",
  ({ title, description, children }) => (
    `<Card>
      <CardHeader>
        <CardTitle>${title}</CardTitle>
        <CardDescription>${description}</CardDescription>
      </CardHeader>
      <CardContent>
        ${children}
      </CardContent>
    </Card>`
  ),
  {
    props: {
      title: figmaConnect.string("title"),
      description: figmaConnect.string("description"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// BADGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Badge",
  ({ variant = "default", children }) => (
    `<Badge variant="${variant}">${children}</Badge>`
  ),
  {
    props: {
      variant: figmaConnect.enum("variant", {
        default: "default",
        secondary: "secondary",
        destructive: "destructive",
        outline: "outline",
      }),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Modal",
  ({ title, open, children }) => (
    `<Modal open={${open}} title="${title}">
      ${children}
    </Modal>`
  ),
  {
    props: {
      title: figmaConnect.string("title"),
      open: figmaConnect.boolean("open"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// CONFIRM DIALOG COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "ConfirmDialog",
  ({ variant = "danger", title, message }) => (
    `<ConfirmDialog
      variant="${variant}"
      title="${title}"
      message="${message}"
    />`
  ),
  {
    props: {
      variant: figmaConnect.enum("variant", {
        danger: "danger",
        warning: "warning",
        info: "info",
        success: "success",
      }),
      title: figmaConnect.string("title"),
      message: figmaConnect.string("message"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// TABS COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Tabs",
  ({ defaultValue, tabs }) => (
    `<Tabs defaultValue="${defaultValue}">
      <TabsList>
        ${tabs.map((tab: any) => `<TabsTrigger value="${tab.value}">${tab.label}</TabsTrigger>`).join("\n")}
      </TabsList>
      ${tabs.map((tab: any) => `<TabsContent value="${tab.value}">${tab.content}</TabsContent>`).join("\n")}
    </Tabs>`
  ),
  {
    props: {
      defaultValue: figmaConnect.string("defaultValue"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// CHECKBOX COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Checkbox",
  ({ label, checked, disabled }) => (
    `<div className="flex items-center space-x-2">
      <Checkbox id="${label}" checked={${checked}} disabled={${disabled}} />
      <label htmlFor="${label}">${label}</label>
    </div>`
  ),
  {
    props: {
      label: figmaConnect.string("label"),
      checked: figmaConnect.boolean("checked"),
      disabled: figmaConnect.boolean("disabled"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// SELECT COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Select",
  ({ placeholder, options }) => (
    `<Select>
      <SelectTrigger>
        <SelectValue placeholder="${placeholder}" />
      </SelectTrigger>
      <SelectContent>
        ${options.map((opt: any) => `<SelectItem value="${opt.value}">${opt.label}</SelectItem>`).join("\n")}
      </SelectContent>
    </Select>`
  ),
  {
    props: {
      placeholder: figmaConnect.string("placeholder"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// ALERT COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Alert",
  ({ variant = "default", title, description }) => (
    `<Alert variant="${variant}">
      <AlertTitle>${title}</AlertTitle>
      <AlertDescription>${description}</AlertDescription>
    </Alert>`
  ),
  {
    props: {
      variant: figmaConnect.enum("variant", {
        default: "default",
        destructive: "destructive",
      }),
      title: figmaConnect.string("title"),
      description: figmaConnect.string("description"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// PROGRESS COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Progress",
  ({ value = 50 }) => (
    `<Progress value={${value}} />`
  ),
  {
    props: {
      value: figmaConnect.number("value"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// QUICK SALE MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "QuickSaleModal",
  ({ open }) => (
    `<QuickSaleModal open={${open}} />`
  ),
  {
    props: {
      open: figmaConnect.boolean("open"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// QUICK INCOME MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "QuickIncomeModal",
  ({ open }) => (
    `<QuickIncomeModal open={${open}} />`
  ),
  {
    props: {
      open: figmaConnect.boolean("open"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// QUICK PRODUCT MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "QuickProductModal",
  ({ open }) => (
    `<QuickProductModal open={${open}} />`
  ),
  {
    props: {
      open: figmaConnect.boolean("open"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "StatCard",
  ({ title, value, trend, icon }) => (
    `<div className="stat-card">
      <div className="stat-icon">${icon}</div>
      <div className="stat-content">
        <p className="stat-title">${title}</p>
        <p className="stat-value">${value}</p>
        <p className="stat-trend">${trend}</p>
      </div>
    </div>`
  ),
  {
    props: {
      title: figmaConnect.string("title"),
      value: figmaConnect.string("value"),
      trend: figmaConnect.string("trend"),
      icon: figmaConnect.string("icon"),
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// TABLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────

figmaConnect.react(
  "Table",
  ({ columns, rows }) => (
    `<Table>
      <TableHeader>
        <TableRow>
          ${columns.map((col: any) => `<TableHead>${col}</TableHead>`).join("\n")}
        </TableRow>
      </TableHeader>
      <TableBody>
        ${rows.map((row: any) => `<TableRow>
          ${row.map((cell: any) => `<TableCell>${cell}</TableCell>`).join("\n")}
        </TableRow>`).join("\n")}
      </TableBody>
    </Table>`
  ),
  {
    props: {},
  }
);

// ─────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────

export default figmaConnect;
